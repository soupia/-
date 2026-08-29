import React, { useState } from "react";
import {
  ArrowLeft,
  DoorOpen,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { GradeLevel } from "../types";

interface TeacherSetupProps {
  onBack: () => void;
  onCreateRoom: (teacherName: string, grade: GradeLevel, apiKey?: string) => Promise<void>;
  isLoading: boolean;
}

export const TeacherSetup: React.FC<TeacherSetupProps> = ({
  onBack,
  onCreateRoom,
  isLoading,
}) => {
  const [teacherName, setTeacherName] = useState("");
  const [targetGrade, setTargetGrade] = useState<GradeLevel>("초등학교 4~6학년");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Key validation state
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<{
    tested: boolean;
    valid: boolean;
    message?: string;
  } | null>(null);

  const cleanApiKey = (key: string) => {
    return key.trim().replace(/^["']|["']$/g, "").trim();
  };

  const handleTestApiKey = async () => {
    const cleaned = cleanApiKey(geminiApiKey);
    if (!cleaned) {
      setKeyValidationStatus({
        tested: true,
        valid: false,
        message: "테스트할 API 키를 먼저 입력해주세요.",
      });
      return;
    }

    setIsValidatingKey(true);
    setKeyValidationStatus(null);
    setError(null);

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cleaned }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setKeyValidationStatus({
          tested: true,
          valid: true,
          message: "정상적으로 인증된 Gemini API 키입니다.",
        });
      } else {
        setKeyValidationStatus({
          tested: true,
          valid: false,
          message: data.error || "유효하지 않은 API 키입니다.",
        });
      }
    } catch (err: any) {
      setKeyValidationStatus({
        tested: true,
        valid: false,
        message: "API 키 검증 중 네트워크 오류가 발생했습니다.",
      });
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teacherName.trim()) {
      setError("선생님 성함 또는 학급명을 입력해주세요.");
      return;
    }

    const cleanedKey = cleanApiKey(geminiApiKey);

    try {
      await onCreateRoom(
        teacherName.trim(),
        targetGrade,
        cleanedKey.length > 0 ? cleanedKey : undefined
      );
    } catch (err: any) {
      setError(err?.message || "방 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-lg mx-auto w-full pt-2 sm:pt-4 space-y-5 animate-in fade-in duration-300">
      <button
        id="teacher-back-btn"
        type="button"
        onClick={onBack}
        className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium text-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>학생 입장 화면으로 돌아가기</span>
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">새 학급 성찰 방 만들기</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              생성된 방 코드를 학생들에게 공유하여 성찰 기록을 수집하고 분석할 수 있습니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="teacher-name-input"
              className="text-sm font-bold text-slate-700 block mb-1.5"
            >
              선생님 성함 / 학급명 <span className="text-rose-500">*</span>
            </label>
            <input
              id="teacher-name-input"
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="예: 3학년 2반 김민지 선생님"
              className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-800 text-sm font-medium"
            />
          </div>

          <div>
            <label
              htmlFor="teacher-grade-select"
              className="text-sm font-bold text-slate-700 block mb-1.5"
            >
              대상 학년 (AI 질문 난이도 기준) <span className="text-rose-500">*</span>
            </label>
            <select
              id="teacher-grade-select"
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value as GradeLevel)}
              className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-800 text-sm font-medium"
            >
              <option value="초등학교 1~3학년">초등학교 1~3학년 (아주 쉽게, 일상 어휘)</option>
              <option value="초등학교 4~6학년">초등학교 4~6학년 (기본, 개념 연결)</option>
              <option value="중학생">중학생 (추론 및 비판적 사고)</option>
              <option value="고등학생">고등학생 (심화 개념 및 다각적 분석)</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              선택한 학년의 어휘력과 인지 수준에 맞춰 AI 소크라테스 질문이 자동 조절됩니다.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="teacher-apikey-input"
                className="text-sm font-bold text-slate-700 block"
              >
                Gemini API 키 (선택사항)
              </label>
              <span className="text-xs text-slate-400">비워두면 기본 서버 AI 키 적용</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="teacher-apikey-input"
                  type={showApiKey ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value);
                    if (keyValidationStatus) setKeyValidationStatus(null);
                  }}
                  placeholder="AIzaSy... (선택 사항)"
                  className="w-full p-3 pr-10 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-800 text-sm font-mono"
                />
                <button
                  id="teacher-apikey-toggle-btn"
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {geminiApiKey.trim().length > 0 && (
                <button
                  type="button"
                  id="test-api-key-btn"
                  onClick={handleTestApiKey}
                  disabled={isValidatingKey}
                  className="px-3.5 py-2.5 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs shrink-0 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isValidatingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>검증 중</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>키 검증</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* API Key Validation Status Badge */}
            {keyValidationStatus && (
              <div
                className={`mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  keyValidationStatus.valid
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {keyValidationStatus.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{keyValidationStatus.message}</span>
              </div>
            )}

            <div className="mt-2 p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-800 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                별도의 키 입력 없이도 AI 스튜디오의 <b>Gemini 3.7 Flash</b> 엔진이 기본 내장되어 있어 질문과 성찰 깊이 분석을 바로 사용하실 수 있습니다.
              </span>
            </div>
          </div>

          {error && (
            <div
              id="teacher-setup-error"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
            >
              {error}
            </div>
          )}

          <button
            id="teacher-create-room-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-98"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <DoorOpen className="w-5 h-5" />
                <span>방 생성하고 대시보드 입장</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
