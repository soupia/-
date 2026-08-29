import React, { useState, useMemo } from "react";
import { Plus, BookOpen, CheckCircle2, Award, Calendar, ChevronRight, MessageSquareQuote, MinusCircle } from "lucide-react";
import { Reflection } from "../types";
import { BADGES, DEPTH_LABELS } from "../data/badges";

interface StudentHomeProps {
  reflections: Reflection[];
  onStartNew: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  reflections,
  onStartNew,
}) => {
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");

  const totalCount = reflections.length;

  // Format date helper: "2026년 8월 29일 (토)"
  const formatDateKR = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  };

  const formatTimeKR = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  const getDateKey = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Group reflections by date
  const { dateGroups, sortedDateKeys } = useMemo(() => {
    const map: Record<string, { display: string; items: Reflection[] }> = {};
    reflections.forEach((ref) => {
      const key = getDateKey(ref.createdAt);
      if (!map[key]) {
        map[key] = { display: formatDateKR(ref.createdAt), items: [] };
      }
      map[key].items.push(ref);
    });

    const keys = Object.keys(map).sort().reverse();
    return { dateGroups: map, sortedDateKeys: keys };
  }, [reflections]);

  const filteredKeys = selectedDateFilter === "all" ? sortedDateKeys : [selectedDateFilter];

  // Helper for Badge icon
  const renderBadgeIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "Footprints":
        return <span className={className}>👣</span>;
      case "Sprout":
        return <span className={className}>🌱</span>;
      case "Flower2":
        return <span className={className}>🌸</span>;
      case "Apple":
        return <span className={className}>🍎</span>;
      case "Trees":
        return <span className={className}>🌳</span>;
      case "Mountain":
        return <span className={className}>🏞️</span>;
      default:
        return <Award className={className} />;
    }
  };

  return (
    <div id="student-home-view" className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Growth Badges Card */}
      <div
        id="badges-card"
        className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              나의 성장 배지
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-500 font-medium">
            총 <span className="font-bold text-sky-600 text-base">{totalCount}</span>번의 성찰
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {BADGES.map((badge) => {
            const isUnlocked = totalCount >= badge.count;
            return (
              <div
                key={badge.count}
                className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                  isUnlocked
                    ? `${badge.bgColor} ${badge.borderColor} shadow-xs scale-100`
                    : "bg-slate-50/70 border-slate-100 opacity-40 grayscale"
                }`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1.5 shadow-xs">
                  {renderBadgeIcon(badge.iconName, "text-xl")}
                </div>
                <span
                  className={`text-xs font-bold ${
                    isUnlocked ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {badge.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {badge.count}회 달성
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Today's Learning Logs Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">배움 성찰 기록</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            오늘 배운 과목을 기록하고 AI 질문을 통해 생각을 한 단계 더 넓혀보세요.
          </p>
        </div>
        <button
          id="student-new-reflection-btn"
          type="button"
          onClick={onStartNew}
          className="bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold py-3 px-5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>새 과목 기록하기</span>
        </button>
      </div>

      {/* 3. Date Filter */}
      {sortedDateKeys.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>날짜별로 모아보기</span>
          </div>
          <select
            id="date-filter-select"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none shadow-2xs"
          >
            <option value="all">전체 날짜 ({totalCount}건)</option>
            {sortedDateKeys.map((k) => (
              <option key={k} value={k}>
                {dateGroups[k].display} ({dateGroups[k].items.length}건)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 4. Reflection Cards List */}
      <div id="reflections-container" className="space-y-6">
        {totalCount === 0 ? (
          <div
            id="empty-reflection-state"
            className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">
              아직 기록된 배움이 없습니다
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto mb-5 leading-relaxed">
              상단의 <b>[새 과목 기록하기]</b> 버튼을 눌러 오늘 수업에서 배운 내용을 적고 첫 번째 성찰을 시작해보세요!
            </p>
            <button
              type="button"
              onClick={onStartNew}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition"
            >
              첫 배움 기록 시작하기
            </button>
          </div>
        ) : (
          filteredKeys.map((key) => {
            const group = dateGroups[key];
            if (!group) return null;
            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-600 whitespace-nowrap">
                    {group.display}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                    {group.items.length}건
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {group.items.map((ref) => {
                    const depthInfo = DEPTH_LABELS[ref.depthLevel || 1];
                    return (
                      <div
                        key={ref.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold text-white ${ref.subjectColor} shadow-2xs`}
                            >
                              {ref.subject}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${depthInfo.bg}`}
                            >
                              {depthInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <span>{formatTimeKR(ref.createdAt)}</span>
                            <span>·</span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              기록 완료
                            </span>
                          </div>
                        </div>

                        {/* Step 1 Content */}
                        <div className="bg-slate-50 p-3.5 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed border border-slate-100">
                          <span className="font-bold text-slate-400 text-[11px] block mb-1">
                            나의 첫 기록
                          </span>
                          <p className="whitespace-pre-line">{ref.text1}</p>
                        </div>

                        {/* Step 2 Content or Skip Status */}
                        {ref.text2 ? (
                          <div className="bg-sky-50/70 p-3.5 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed border border-sky-100 border-l-4 border-l-sky-500 space-y-2">
                            <div className="flex items-start gap-1.5 text-sky-800 font-semibold text-xs">
                              <MessageSquareQuote className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                              <span className="italic leading-snug">AI 질문: {ref.aiQuestion}</span>
                            </div>
                            <div className="pt-1.5 border-t border-sky-100/60">
                              <span className="font-bold text-sky-900 text-[11px] block mb-0.5">
                                깊은 성찰
                              </span>
                              <p className="whitespace-pre-line font-medium text-slate-800">
                                {ref.text2}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic flex items-center gap-1.5 px-1">
                            <MinusCircle className="w-3.5 h-3.5 text-slate-300" />
                            <span>추가 질문 성찰 없이 1단계로 완료됨</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
