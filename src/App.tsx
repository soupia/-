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
    if (!code) return;
    try {
      const roomRes = await fetch(`/api/rooms/${code}`);
      if (roomRes.ok) {
        const roomData: Room = await roomRes.json();
        setRoom(roomData);

        const refUrl = currentStudent
          ? `/api/rooms/${code}/reflections?studentName=${encodeURIComponent(currentStudent)}`
          : `/api/rooms/${code}/reflections`;

        const refRes = await fetch(refUrl);
        if (refRes.ok) {
          const refData = await refRes.json();
          setReflections(refData.reflections || []);
          return;
        }
      }
    } catch (err) {
      console.warn("fetchRoomData notice:", err);
    }

    // Fallback: check local storage database (for Vercel/static deployment)
    try {
      const localRooms: Record<string, Room> = JSON.parse(
        localStorage.getItem("reflectionApp_local_rooms") || "{}"
      );
      if (localRooms[code]) {
        setRoom(localRooms[code]);
        const localRefs: Reflection[] = JSON.parse(
          localStorage.getItem(`reflectionApp_local_reflections_${code}`) || "[]"
        );
        if (currentStudent) {
          setReflections(localRefs.filter((r) => r.studentName === currentStudent));
        } else {
          setReflections(localRefs);
        }
      }
    } catch (e) {
      console.warn("Local room fallback failed:", e);
    }
  }, []);

  // Restore Session on mount
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const teacherSaved = localStorage.getItem("reflectionApp_teacher");
        if (teacherSaved) {
          const { code } = JSON.parse(teacherSaved);
          if (code) {
            const res = await fetch(`/api/rooms/${code}`).catch(() => null);
            if (res && res.ok && isMounted) {
              const r: Room = await res.json();
              setRole("teacher");
              setRoomCode(code);
              setRoom(r);
              setView("teacher-dashboard");
              await fetchRoomData(code);
              return;
            } else {
              const localRooms: Record<string, Room> = JSON.parse(
                localStorage.getItem("reflectionApp_local_rooms") || "{}"
              );
              if (localRooms[code] && isMounted) {
                setRole("teacher");
                setRoomCode(code);
                setRoom(localRooms[code]);
                setView("teacher-dashboard");
                await fetchRoomData(code);
                return;
              }
            }
          }
        }

        const studentSaved = localStorage.getItem("reflectionApp_student");
        if (studentSaved) {
          const { code, name } = JSON.parse(studentSaved);
          if (code && name) {
            const res = await fetch(`/api/rooms/${code}`).catch(() => null);
            if (res && res.ok && isMounted) {
              const r: Room = await res.json();
              setRole("student");
              setRoomCode(code);
              setStudentName(name);
              setRoom(r);
              setView("student-home");
              await fetchRoomData(code, name);
              return;
            } else {
              const localRooms: Record<string, Room> = JSON.parse(
                localStorage.getItem("reflectionApp_local_rooms") || "{}"
              );
              if (localRooms[code] && isMounted) {
                setRole("student");
                setRole("student");
                setRoomCode(code);
                setStudentName(name);
                setRoom(localRooms[code]);
                setView("student-home");
                await fetchRoomData(code, name);
                return;
              }
            }
          }
        }
      } catch (e) {
        console.warn("Session restore skipped:", e);
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [fetchRoomData]);

  // Periodic polling for room data updates
  useEffect(() => {
    if (!roomCode || view === "landing" || view === "teacher-setup") return;
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
      let roomData: Room | null = null;

      try {
        const res = await fetch(`/api/rooms/${code}`);
        if (res.ok) {
          roomData = await res.json();
        }
      } catch (_) {
        // static Vercel
      }

      // Check local storage fallback
      if (!roomData) {
        const localRooms: Record<string, Room> = JSON.parse(
          localStorage.getItem("reflectionApp_local_rooms") || "{}"
        );
        if (localRooms[code]) {
          roomData = localRooms[code];
        } else if (code === "DEMO1") {
          roomData = {
            id: "DEMO1",
            teacherName: "3학년 2반 김민지 선생님",
            targetGrade: "초등학교 4~6학년",
            createdAt: new Date().toISOString(),
          };
        }
      }

      if (!roomData) {
        throw new Error("존재하지 않는 방 코드입니다.\n선생님께 방 코드를 다시 확인해주세요.");
      }

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
      const cleanKey = apiKey ? apiKey.trim().replace(/^["']|["']$/g, "") : undefined;
      let newRoom: Room | null = null;

      try {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherName: teacherName.trim(),
            targetGrade: grade,
            geminiApiKey: cleanKey && cleanKey.length > 0 ? cleanKey : undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          newRoom = data.room;
        }
      } catch (_) {
        // static Vercel
      }

      if (!newRoom) {
        const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        let generatedCode = "";
        for (let i = 0; i < 5; i++) {
          generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        newRoom = {
          id: generatedCode,
          teacherName: teacherName.trim(),
          targetGrade: grade,
          geminiApiKey: cleanKey && cleanKey.length > 0 ? cleanKey : undefined,
          createdAt: new Date().toISOString(),
        };

        const localRooms = JSON.parse(
          localStorage.getItem("reflectionApp_local_rooms") || "{}"
        );
        localRooms[generatedCode] = newRoom;
        localStorage.setItem("reflectionApp_local_rooms", JSON.stringify(localRooms));
      }

      setRole("teacher");
      setRoomCode(newRoom.id);
      setRoom(newRoom);
      setView("teacher-dashboard");

      localStorage.setItem("reflectionApp_teacher", JSON.stringify({ code: newRoom.id }));

      await fetchRoomData(newRoom.id);
    } catch (err: any) {
      console.error("handleCreateRoom error:", err);
      throw err;
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
            targetGrade={room?.targetGrade}
            customApiKey={room?.geminiApiKey}
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
