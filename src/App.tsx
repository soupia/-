import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { StudentJoin } from "./components/StudentJoin";
import { TeacherSetup } from "./components/TeacherSetup";
import { StudentHome } from "./components/StudentHome";
import { ReflectionFlow } from "./components/ReflectionFlow";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { AlertModal } from "./components/AlertModal";
import { Reflection, Room, GradeLevel } from "./types";

export default function App() {
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [room, setRoom] = useState<Room | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [view, setView] = useState<
    "landing" | "teacher-setup" | "student-home" | "reflection-flow" | "teacher-dashboard"
  >("landing");
  const [isLoading, setIsLoading] = useState(false);

  // Alert Modal state
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    type?: "info" | "warning" | "success" | "confirm";
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });

  const showAlert = (
    message: string,
    title?: string,
    type: "info" | "warning" | "success" = "warning"
  ) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      confirmText: "확인",
      onConfirm: () => setAlertState((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const showConfirm = (
    message: string,
    onConfirmAction: () => void,
    title: string = "확인"
  ) => {
    setAlertState({
      isOpen: true,
      type: "confirm",
      title,
      message,
      confirmText: "확인",
      cancelText: "취소",
      onConfirm: () => {
        setAlertState((prev) => ({ ...prev, isOpen: false }));
        onConfirmAction();
      },
      onCancel: () => setAlertState((prev) => ({ ...prev, isOpen: false })),
    });
  };

  // Fetch Room info & reflections
  const fetchRoomData = useCallback(async (code: string, currentStudent?: string) => {
    try {
      const roomRes = await fetch(`/api/rooms/${code}`);
      if (!roomRes.ok) throw new Error("방을 찾을 수 없습니다.");
      const roomData: Room = await roomRes.json();
      setRoom(roomData);

      const refUrl = currentStudent
        ? `/api/rooms/${code}/reflections?studentName=${encodeURIComponent(currentStudent)}`
        : `/api/rooms/${code}/reflections`;

      const refRes = await fetch(refUrl);
      if (refRes.ok) {
        const refData = await refRes.json();
        setReflections(refData.reflections || []);
      }
    } catch (err) {
      console.error("fetchRoomData error:", err);
    }
  }, []);

  // Restore Session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const teacherSaved = localStorage.getItem("reflectionApp_teacher");
        if (teacherSaved) {
          const { code } = JSON.parse(teacherSaved);
          const res = await fetch(`/api/rooms/${code}`);
          if (res.ok) {
            const r: Room = await res.json();
            setRole("teacher");
            setRoomCode(code);
            setRoom(r);
            setView("teacher-dashboard");
            await fetchRoomData(code);
            return;
          }
          localStorage.removeItem("reflectionApp_teacher");
        }

        const studentSaved = localStorage.getItem("reflectionApp_student");
        if (studentSaved) {
          const { code, name } = JSON.parse(studentSaved);
          const res = await fetch(`/api/rooms/${code}`);
          if (res.ok) {
            const r: Room = await res.json();
            setRole("student");
            setRoomCode(code);
            setStudentName(name);
            setRoom(r);
            setView("student-home");
            await fetchRoomData(code, name);
            return;
          }
          localStorage.removeItem("reflectionApp_student");
        }
      } catch (e) {
        console.warn("Session restore skipped:", e);
      }
    };

    restoreSession();
  }, [fetchRoomData]);

  // Periodic polling for room data updates
  useEffect(() => {
    if (!roomCode) return;
    const interval = setInterval(() => {
      if (view === "teacher-dashboard") {
        fetchRoomData(roomCode);
      } else if (view === "student-home" && studentName) {
        fetchRoomData(roomCode, studentName);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [roomCode, view, studentName, fetchRoomData]);

  // Join Room (Student)
  const handleJoinStudent = async (code: string, name: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        throw new Error("존재하지 않는 방 코드입니다.\n선생님께 방 코드를 다시 확인해주세요.");
      }
      const roomData: Room = await res.json();

      setRole("student");
      setRoomCode(code);
      setStudentName(name);
      setRoom(roomData);
      setView("student-home");

      localStorage.setItem("reflectionApp_student", JSON.stringify({ code, name }));

      // Fetch student reflections
      await fetchRoomData(code, name);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Room (Teacher)
  const handleCreateRoom = async (
    teacherName: string,
    grade: GradeLevel,
    apiKey?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherName, targetGrade: grade, geminiApiKey: apiKey }),
      });
      if (!res.ok) throw new Error("방 생성에 실패했습니다.");
      const data = await res.json();
      const newRoom: Room = data.room;

      setRole("teacher");
      setRoomCode(newRoom.id);
      setRoom(newRoom);
      setView("teacher-dashboard");

      localStorage.setItem("reflectionApp_teacher", JSON.stringify({ code: newRoom.id }));

      await fetchRoomData(newRoom.id);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Room Grade
  const handleUpdateGrade = async (newGrade: GradeLevel) => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/rooms/${roomCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetGrade: newGrade }),
      });
      if (res.ok) {
        setRoom((prev) => (prev ? { ...prev, targetGrade: newGrade } : null));
        showAlert(
          `대상 학년이 '${newGrade}'(으)로 변경되었습니다.\n새로 생성되는 질문부터 난이도가 적용됩니다.`,
          "설정 완료",
          "success"
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Student Reflection Finished
  const handleReflectionComplete = (newRef: Reflection) => {
    setReflections((prev) => [newRef, ...prev]);
  };

  // Leave Room
  const handleLeaveRoom = () => {
    showConfirm(
      role === "teacher"
        ? "정말 이 방을 나가시겠습니까? 학생들의 기존 기록은 안전하게 보관됩니다."
        : "방에서 나가시겠습니까? 작성한 기록은 방에 보관되며, 방 코드로 다시 입장하면 이어서 볼 수 있습니다.",
      () => {
        if (role === "teacher") {
          localStorage.removeItem("reflectionApp_teacher");
        } else {
          localStorage.removeItem("reflectionApp_student");
        }
        setRole(null);
        setRoomCode(null);
        setStudentName("");
        setRoom(null);
        setReflections([]);
        setView("landing");
      },
      "방 나가기"
    );
  };

  const handleGoHome = () => {
    if (role === "student") {
      if (view === "reflection-flow") {
        showConfirm("작성 중인 성찰 내용이 저장되지 않고 취소됩니다. 목록으로 이동할까요?", () => {
          setView("student-home");
        });
      } else {
        setView("student-home");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-800">
      <Navbar
        role={role}
        roomCode={roomCode}
        studentName={studentName}
        teacherName={room?.teacherName}
        onGoHome={handleGoHome}
        onLeaveRoom={handleLeaveRoom}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {view === "landing" && (
          <StudentJoin
            onJoin={handleJoinStudent}
            onSwitchToTeacher={() => setView("teacher-setup")}
            isLoading={isLoading}
          />
        )}

        {view === "teacher-setup" && (
          <TeacherSetup
            onBack={() => setView("landing")}
            onCreateRoom={handleCreateRoom}
            isLoading={isLoading}
          />
        )}

        {view === "student-home" && (
          <StudentHome
            reflections={reflections}
            onStartNew={() => setView("reflection-flow")}
          />
        )}

        {view === "reflection-flow" && roomCode && (
          <ReflectionFlow
            roomCode={roomCode}
            studentName={studentName}
            previousCount={reflections.length}
            onComplete={handleReflectionComplete}
            onBackToHome={() => {
              showConfirm("작성 중인 성찰 내용이 사라집니다. 목록으로 돌아갈까요?", () => {
                setView("student-home");
              });
            }}
            onRequestAlert={(msg) => showAlert(msg)}
          />
        )}

        {view === "teacher-dashboard" && room && (
          <TeacherDashboard
            room={room}
            reflections={reflections}
            onUpdateGrade={handleUpdateGrade}
            onLeaveRoom={handleLeaveRoom}
            onRequestAlert={(msg) => showAlert(msg)}
          />
        )}
      </main>

      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
      />
    </div>
  );
}
