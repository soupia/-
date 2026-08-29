import React, { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Users,
  Settings,
  Flame,
  Download,
  Search,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Sparkles,
  BarChart3,
  LogOut,
} from "lucide-react";
import { Reflection, Room, GradeLevel, SubjectType, StudentSummary } from "../types";
import { DEPTH_LABELS, SUBJECT_OPTIONS } from "../data/badges";
import { StudentDetailModal } from "./StudentDetailModal";

interface TeacherDashboardProps {
  room: Room;
  reflections: Reflection[];
  onUpdateGrade: (grade: GradeLevel) => Promise<void>;
  onLeaveRoom: () => void;
  onRequestAlert: (msg: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  room,
  reflections,
  onUpdateGrade,
  onLeaveRoom,
  onRequestAlert,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<string | null>(null);

  // Copy Room Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute Aggregate Stats
  const stats = useMemo(() => {
    const total = reflections.length;
    const depthCounts = [0, 0, 0, 0];
    const subjectDepthSum: Record<string, { sum: number; count: number }> = {};
    const subjectCounts: Record<string, number> = {};
    let completedTurn2 = 0;

    reflections.forEach((r) => {
      const lvl = r.depthLevel >= 1 && r.depthLevel <= 4 ? r.depthLevel : 1;
      depthCounts[lvl - 1]++;
      subjectCounts[r.subject] = (subjectCounts[r.subject] || 0) + 1;

      if (!subjectDepthSum[r.subject]) {
        subjectDepthSum[r.subject] = { sum: 0, count: 0 };
      }
      subjectDepthSum[r.subject].sum += lvl;
      subjectDepthSum[r.subject].count++;

      if (r.text2 && r.text2.trim().length > 0) {
        completedTurn2++;
      }
    });

    const mostActiveSubject =
      Object.keys(subjectCounts).sort(
        (a, b) => subjectCounts[b] - subjectCounts[a]
      )[0] || "-";

    const turn2Rate = total > 0 ? Math.round((completedTurn2 / total) * 100) : 0;
    const uniqueStudents = new Set(reflections.map((r) => r.studentName)).size;

    const subjects: SubjectType[] = ["국어", "수학", "사회", "과학", "영어", "기타"];
    const subjectStats = subjects.map((sub) => {
      const item = subjectDepthSum[sub];
      return {
        subject: sub,
        count: item ? item.count : 0,
        avg: item ? +(item.sum / item.count).toFixed(2) : 0,
      };
    });

    return {
      total,
      depthCounts,
      mostActiveSubject,
      turn2Rate,
      uniqueStudents,
      subjectStats,
    };
  }, [reflections]);

  // Compute Student Roster
  const studentRoster: StudentSummary[] = useMemo(() => {
    const map: Record<string, Reflection[]> = {};
    reflections.forEach((r) => {
      if (!map[r.studentName]) map[r.studentName] = [];
      map[r.studentName].push(r);
    });

    return Object.entries(map)
      .map(([name, items]) => {
        const total = items.length;
        const avgDepth =
          total > 0
            ? +(
                items.reduce((sum, r) => sum + (r.depthLevel || 1), 0) / total
              ).toFixed(1)
            : 0;
        const turn2Count = items.filter((r) => r.text2 && r.text2.trim().length > 0).length;
        const turn2Rate = total > 0 ? Math.round((turn2Count / total) * 100) : 0;
        const lastActive = items.reduce(
          (max, r) => (new Date(r.createdAt) > new Date(max) ? r.createdAt : max),
          items[0].createdAt
        );

        return {
          name,
          total,
          avgDepth,
          turn2Rate,
          lastActive,
          items,
        };
      })
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
  }, [reflections]);

  const filteredRoster = useMemo(() => {
    const term = searchName.trim().toLowerCase();
    if (!term) return studentRoster;
    return studentRoster.filter((s) => s.name.toLowerCase().includes(term));
  }, [studentRoster, searchName]);

  // Exemplary 4-Step Submissions
  const exemplaryList = useMemo(() => {
    return reflections.filter((r) => r.depthLevel === 4).slice(0, 5);
  }, [reflections]);

  // Export CSV
  const handleExportCSV = () => {
    if (reflections.length === 0) {
      onRequestAlert("내려받을 성찰 데이터가 없습니다.");
      return;
    }

    const headers = ["날짜", "시간", "학생 이름", "과목", "성찰 깊이", "첫 기록", "깊은 성찰"];
    const rows = [...reflections]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((r) => {
        const d = new Date(r.createdAt);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const timeStr = d.toLocaleTimeString("ko-KR");
        const depthLabel = DEPTH_LABELS[r.depthLevel || 1]?.label || `${r.depthLevel}단계`;
        const cleanText1 = (r.text1 || "").replace(/"/g, '""').replace(/\n/g, " ");
        const cleanText2 = (r.text2 || "").replace(/"/g, '""').replace(/\n/g, " ");
        return `"${dateStr}","${timeStr}","${r.studentName}","${r.subject}","${depthLabel}","${cleanText1}","${cleanText2}"`;
      });

    const csvContent = [headers.join(","), ...rows].join("\n");
    // Add UTF-8 BOM (\uFEFF) for Excel compatibility in Korean
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${room.id}_학급_배움성찰기록_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDateKR = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  };

  return (
    <div id="teacher-dashboard-view" className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Room Code Banner */}
      <div
        id="teacher-room-banner"
        className="bg-linear-to-r from-sky-600 to-sky-700 text-white rounded-2xl shadow-md p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5"
      >
        <div className="text-center sm:text-left">
          <div className="text-sky-100 text-xs sm:text-sm font-semibold">
            학생들에게 알려줄 방 코드
          </div>
          <div
            id="banner-room-code"
            className="text-4xl sm:text-5xl font-mono font-black tracking-widest mt-1 text-white select-all"
          >
            {room.id}
          </div>
          <div className="text-sky-200 text-xs mt-1">
            {room.teacherName} · {room.targetGrade}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2.5 text-center border border-white/20">
            <div className="text-sky-100 text-xs font-medium">참여 학생</div>
            <div className="text-2xl font-extrabold">{stats.uniqueStudents}명</div>
          </div>
          <button
            id="copy-room-code-btn"
            type="button"
            onClick={handleCopyCode}
            className="bg-white text-sky-700 hover:bg-sky-50 active:scale-95 rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>코드 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. App Settings: Target Grade Real-time Selector */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6">
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-sky-600" />
          <span>학급 설정</span>
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <label
            htmlFor="dashboard-grade-select"
            className="text-xs sm:text-sm font-bold text-slate-700 shrink-0"
          >
            대상 학년 (AI 질문 난이도) :
          </label>
          <select
            id="dashboard-grade-select"
            value={room.targetGrade}
            onChange={(e) => onUpdateGrade(e.target.value as GradeLevel)}
            className="bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-2 focus:ring-sky-500 p-2 font-semibold shadow-2xs outline-none"
          >
            <option value="초등학교 1~3학년">초등학교 1~3학년 (아주 쉽게)</option>
            <option value="초등학교 4~6학년">초등학교 4~6학년 (기본)</option>
            <option value="중학생">중학생 (추론/비판)</option>
            <option value="고등학생">고등학생 (심화)</option>
          </select>
          <span className="text-xs text-slate-500">
            변경 즉시 이후 학생들의 성찰 질문 난이도에 자동 반영됩니다.
          </span>
        </div>
      </div>

      {/* 3. Metric Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 border-l-4 border-l-sky-500">
          <div className="text-slate-500 text-xs font-semibold mb-1">누적 기록 수</div>
          <div className="text-3xl font-extrabold text-slate-800">
            {stats.total}
            <span className="text-sm font-normal text-slate-400 ml-1">건</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 border-l-4 border-l-orange-500">
          <div className="text-slate-500 text-xs font-semibold mb-1">
            가장 성찰이 활발한 과목
          </div>
          <div className="text-3xl font-extrabold text-slate-800">
            {stats.mostActiveSubject}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 border-l-4 border-l-emerald-500">
          <div className="text-slate-500 text-xs font-semibold mb-1">2턴 완료율</div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {stats.turn2Rate}
            <span className="text-sm font-normal text-slate-400 ml-1">%</span>
          </div>
        </div>
      </div>

      {/* 4. Depth Distribution & Subject Levels Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Depth Level Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>전체 성찰 깊이 단계 분포</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">총 {stats.total}건</span>
          </div>

          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((lvl) => {
              const count = stats.depthCounts[lvl - 1] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const info = DEPTH_LABELS[lvl];

              const barColors: Record<number, string> = {
                1: "bg-slate-400",
                2: "bg-sky-500",
                3: "bg-emerald-500",
                4: "bg-amber-500",
              };

              return (
                <div key={lvl} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{info.label} ({info.desc})</span>
                    <span>
                      {count}건 <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColors[lvl]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>1단계: 단순 사실</span>
            <span>4단계: 전이 및 실천</span>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>과목별 평균 성찰 수준</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">최대 4.0 단계</span>
          </div>

          <div className="space-y-3 pt-2">
            {stats.subjectStats.map((item) => {
              const pct = Math.min(100, Math.round((item.avg / 4) * 100));
              return (
                <div key={item.subject} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="font-bold">{item.subject}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        ({item.count}건)
                      </span>
                    </span>
                    <span className="font-bold text-sky-700">{item.avg} / 4.0</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Live Feed: Exemplary 4-Step Reflections */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          <span>우수 성찰 사례 (4단계: 적용)</span>
        </h3>

        {exemplaryList.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-400 text-center py-6">
            아직 4단계(새로운 상황 적용 및 실천)로 분류된 성찰이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {exemplaryList.map((r) => {
              const body = r.text2 || r.text1;
              return (
                <div
                  key={r.id}
                  className="bg-amber-50/60 border-l-4 border-l-amber-500 p-3.5 rounded-r-xl border border-amber-200/60 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">
                      4단계 적용
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {r.subject} · {r.studentName}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    "{body}"
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <span>학생별 누적 현황</span>
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="이름 검색"
                className="text-xs border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 focus:ring-2 focus:ring-sky-500 outline-none w-32 sm:w-44"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>

            <button
              id="export-csv-btn"
              type="button"
              onClick={handleExportCSV}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 border border-sky-200 hover:bg-sky-50 rounded-lg px-3 py-1.5 transition flex items-center gap-1 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV 다운로드</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-200 text-xs">
                <th className="py-2.5 pr-4 font-semibold">이름</th>
                <th className="py-2.5 pr-4 font-semibold">총 기록</th>
                <th className="py-2.5 pr-4 font-semibold">평균 깊이</th>
                <th className="py-2.5 pr-4 font-semibold">2턴 완료율</th>
                <th className="py-2.5 pr-4 font-semibold">최근 활동</th>
                <th className="py-2.5 font-semibold text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {searchName ? "검색 결과가 없습니다." : "아직 참여한 학생이 없습니다."}
                  </td>
                </tr>
              ) : (
                filteredRoster.map((s) => (
                  <tr key={s.name} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 pr-4 font-bold text-slate-800">{s.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{s.total}건</td>
                    <td className="py-3 pr-4 font-semibold text-sky-700">{s.avgDepth}단계</td>
                    <td className="py-3 pr-4 text-slate-600">{s.turn2Rate}%</td>
                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                      {formatDateKR(s.lastActive)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForModal(s.name)}
                        className="text-xs font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-0.5 transition"
                      >
                        <span>기록 보기</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Exit Room Action */}
      <div className="text-center pt-4 pb-8">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>이 방에서 나가기 / 새 방 만들기</span>
        </button>
      </div>

      {/* Student Detail Timeline Modal */}
      <StudentDetailModal
        studentName={selectedStudentForModal}
        reflections={reflections}
        onClose={() => setSelectedStudentForModal(null)}
      />
    </div>
  );
};
