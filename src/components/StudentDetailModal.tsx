import React from "react";
import { X, Calendar, CheckCircle2, MessageSquareQuote, Award } from "lucide-react";
import { Reflection } from "../types";
import { DEPTH_LABELS } from "../data/badges";

interface StudentDetailModalProps {
  studentName: string | null;
  reflections: Reflection[];
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentName,
  reflections,
  onClose,
}) => {
  if (!studentName) return null;

  const studentReflections = reflections.filter((r) => r.studentName === studentName);
  const total = studentReflections.length;
  const avgDepth =
    total > 0
      ? (
          studentReflections.reduce((acc, r) => acc + (r.depthLevel || 1), 0) /
          total
        ).toFixed(1)
      : "0.0";

  // Group by date
  const formatDateKR = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  };

  const formatTimeKR = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  const dateGroups: Record<string, Reflection[]> = {};
  studentReflections.forEach((ref) => {
    const d = new Date(ref.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dateGroups[key]) dateGroups[key] = [];
    dateGroups[key].push(ref);
  });

  const sortedKeys = Object.keys(dateGroups).sort().reverse();

  return (
    <div
      id="student-detail-modal-backdrop"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200"
    >
      <div
        id="student-detail-modal-box"
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                {studentName} 학생의 성찰 기록
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              총 <span className="font-bold text-sky-600">{total}건</span>의 성찰 · 평균 깊이{" "}
              <span className="font-bold text-amber-600">{avgDepth}단계</span>
            </p>
          </div>
          <button
            id="close-student-detail-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body List */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {sortedKeys.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              기록된 성찰이 없습니다.
            </div>
          ) : (
            sortedKeys.map((key) => {
              const list = dateGroups[key];
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">
                      {formatDateKR(list[0].createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] text-slate-400">{list.length}건</span>
                  </div>

                  <div className="space-y-3">
                    {list.map((ref) => {
                      const depthInfo = DEPTH_LABELS[ref.depthLevel || 1];
                      return (
                        <div
                          key={ref.id}
                          className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${ref.subjectColor}`}
                              >
                                {ref.subject}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${depthInfo.bg}`}
                              >
                                {depthInfo.label}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">
                              {formatTimeKR(ref.createdAt)}
                            </span>
                          </div>

                          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-400 text-[11px] block mb-0.5">
                              첫 기록
                            </span>
                            <p className="whitespace-pre-line">{ref.text1}</p>
                          </div>

                          {ref.text2 ? (
                            <div className="bg-sky-50/80 rounded-lg p-3 border-l-3 border-l-sky-500 text-xs sm:text-sm space-y-1.5 border border-sky-100">
                              {ref.aiQuestion && (
                                <div className="text-[11px] text-sky-800 font-semibold italic flex items-center gap-1">
                                  <MessageSquareQuote className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                  <span>{ref.aiQuestion}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-sky-900 text-[11px] block mb-0.5">
                                  깊은 성찰
                                </span>
                                <p className="text-slate-800 whitespace-pre-line font-medium">
                                  {ref.text2}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              추가 성찰 없이 1단계로 제출됨
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
    </div>
  );
};
