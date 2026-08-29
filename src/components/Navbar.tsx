import React from "react";
import { Sprout, Home, LogOut, ShieldCheck, User } from "lucide-react";

interface NavbarProps {
  role: "teacher" | "student" | null;
  roomCode: string | null;
  studentName?: string;
  teacherName?: string;
  onGoHome: () => void;
  onLeaveRoom: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  roomCode,
  studentName,
  teacherName,
  onGoHome,
  onLeaveRoom,
}) => {
  return (
    <nav
      id="main-navigation"
      className="bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200 sticky top-0 z-30"
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          id="nav-logo-btn"
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group transition focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-800 group-hover:text-sky-600 transition-colors">
              배움성찰노트
            </span>
            {roomCode && (
              <span className="hidden sm:inline-block ml-2 text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                방 {roomCode}
              </span>
            )}
          </div>
        </button>

        <div id="nav-actions" className="flex items-center gap-2 sm:gap-3">
          {role === "student" && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span className="font-semibold text-slate-800">{studentName}</span>
                <span className="text-slate-400">학생</span>
              </div>
              <button
                id="nav-student-home-btn"
                type="button"
                onClick={onGoHome}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-sky-600 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 transition active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">홈</span>
              </button>
              <button
                id="nav-student-leave-btn"
                type="button"
                onClick={onLeaveRoom}
                title="방 나가기"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-rose-600 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">나가기</span>
              </button>
            </>
          )}

          {role === "teacher" && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="font-semibold">{teacherName || "선생님"}</span>
                <span className="hidden sm:inline text-amber-700/80">대시보드</span>
              </div>
              <button
                id="nav-teacher-leave-btn"
                type="button"
                onClick={onLeaveRoom}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-rose-600 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">방 나가기</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
