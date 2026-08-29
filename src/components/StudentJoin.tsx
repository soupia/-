import React, { useState } from "react";
import { Sprout, LogIn, Sparkles, BookOpen, KeyRound } from "lucide-react";

interface StudentJoinProps {
  onJoin: (roomCode: string, studentName: string) => Promise<void>;
  onSwitchToTeacher: () => void;
  isLoading: boolean;
}

export const StudentJoin: React.FC<StudentJoinProps> = ({
  onJoin,
  onSwitchToTeacher,
  isLoading,
}) => {
  const [roomCode, setRoomCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedCode = roomCode.trim().toUpperCase();
    const trimmedName = studentName.trim();

    if (!trimmedCode) {
      setError("방 코드를 입력해주세요.");
      return;
    }
    if (!trimmedName) {
      setError("학생 이름을 입력해주세요.");
      return;
    }

    try {
      await onJoin(trimmedCode, trimmedName);
    } catch (err: any) {
      setError(err?.message || "입장 중 오류가 발생했습니다. 방 코드를 확인해주세요.");
    }
  };

  const handleDemoFill = () => {
    setRoomCode("DEMO1");
    setStudentName("김하늘");
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto w-full pt-4 sm:pt-8 animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 mb-4 shadow-xs">
          <Sprout className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          배움성찰노트
        </h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          선생님이 알려주신 방 코드로 입장하여 오늘의 배움을 성찰해보세요.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="join-room-code"
              className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center justify-between"
            >
              <span>방 코드 (5자리)</span>
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                체험용 방(DEMO1) 입력
              </button>
            </label>
            <input
              id="join-room-code"
              type="text"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="예: A3F9K"
              className="w-full p-3.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-center text-2xl font-mono font-bold tracking-widest uppercase placeholder:text-slate-300"
            />
          </div>

          <div>
            <label
              htmlFor="join-student-name"
              className="text-sm font-bold text-slate-700 block mb-1.5"
            >
              내 이름
            </label>
            <input
              id="join-student-name"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full p-3.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>

          {error && (
            <div
              id="join-error-msg"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
            >
              {error}
            </div>
          )}

          <button
            id="join-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-98"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>입장하기</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>2단계 소크라테스식 성찰</span>
          </div>
          <button
            id="join-teacher-link"
            type="button"
            onClick={onSwitchToTeacher}
            className="text-slate-400 hover:text-slate-600 transition flex items-center gap-1 font-medium underline-offset-2 hover:underline"
          >
            <KeyRound className="w-3.5 h-3.5" />
            선생님이신가요?
          </button>
        </div>
      </div>
    </div>
  );
};
