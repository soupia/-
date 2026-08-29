import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Lightbulb,
  Sparkles,
  Quote,
  AlertTriangle,
  Send,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { SubjectType, Reflection, BadgeInfo } from "../types";
import { SUBJECT_OPTIONS, BADGES } from "../data/badges";

interface ReflectionFlowProps {
  roomCode: string;
  studentName: string;
  previousCount: number;
  onComplete: (newReflection: Reflection) => void;
  onBackToHome: () => void;
  onRequestAlert: (msg: string) => void;
}

export const ReflectionFlow: React.FC<ReflectionFlowProps> = ({
  roomCode,
  studentName,
  previousCount,
  onComplete,
  onBackToHome,
  onRequestAlert,
}) => {
  const [step, setStep] = useState<1 | 2 | "loading" | "complete">(1);
  const [loadingTitle, setLoadingTitle] = useState("AI 선생님이 기록을 읽고 있습니다...");
  const [loadingDesc, setLoadingDesc] = useState("생각을 넓혀줄 질문을 준비 중이에요.");

  const [selectedSubject, setSelectedSubject] = useState<SubjectType | null>(null);
  const [selectedSubjectColor, setSelectedSubjectColor] = useState<string>("bg-slate-500");

  const [text1, setText1] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [isFallback, setIsFallback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [text2, setText2] = useState("");

  const [unlockedBadge, setUnlockedBadge] = useState<BadgeInfo | null>(null);

  // Subject selection handler
  const handleSelectSubject = (subject: SubjectType) => {
    setSelectedSubject(subject);
    const found = SUBJECT_OPTIONS.find((s) => s.name === subject);
    if (found) {
      // Extract bg-color from activeColor
      const colorMatch = found.activeColor.match(/bg-[a-z]+-[0-9]+/);
      setSelectedSubjectColor(colorMatch ? colorMatch[0] : "bg-slate-500");
    }
  };

  // Step 1 Submission
  const handleSubmitStep1 = async () => {
    if (!selectedSubject) {
      onRequestAlert("먼저 어떤 과목을 배웠는지 선택해주세요!");
      return;
    }

    const trimmed = text1.trim();
    if (trimmed.length < 10) {
      onRequestAlert("배움 기록이 너무 짧습니다.\n배운 내용을 2~3줄 이상 구체적으로 적어주세요. (최소 10자 이상)");
      return;
    }

    setStep("loading");
    setLoadingTitle("AI 선생님이 기록을 읽고 있습니다...");
    setLoadingDesc("생각을 넓혀줄 소크라테스 질문을 준비 중이에요.");

    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          subject: selectedSubject,
          text: trimmed,
        }),
      });

      if (!res.ok) throw new Error("질문 생성 실패");
      const data = await res.json();

      setAiQuestion(data.question || "이 내용을 일상생활에서 어떻게 적용해볼 수 있을까요?");
      setAiHint(data.hint || "우리 주변의 경험과 비교해보세요.");
      setIsFallback(Boolean(data.fallback));
      setStep(2);
    } catch (err) {
      console.error(err);
      setAiQuestion("이 내용을 배운 후, 일상생활에서 비슷하게 적용할 수 있는 상황은 무엇이 있을까요?");
      setAiHint("주말에 가족과 함께 있거나 길을 걸을 때 마주치는 상황을 떠올려보세요.");
      setIsFallback(true);
      setStep(2);
    }
  };

  // Step 2 Submission (or Skip)
  const handleFinishReflection = async (secondInput: string) => {
    setStep("loading");
    setLoadingTitle("성찰 깊이를 분석하고 저장 중입니다...");
    setLoadingDesc("잠시만 기다려주세요.");

    try {
      // 1. Classify depth with Gemini
      let depthLevel: 1 | 2 | 3 | 4 = secondInput ? 2 : 1;
      try {
        const classRes = await fetch("/api/classify-depth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            subject: selectedSubject,
            text1,
            text2: secondInput,
          }),
        });
        if (classRes.ok) {
          const depthData = await classRes.json();
          if (depthData.level >= 1 && depthData.level <= 4) {
            depthLevel = depthData.level as 1 | 2 | 3 | 4;
          }
        }
      } catch (e) {
        console.warn("Classify depth fallback:", e);
      }

      // 2. Save reflection to Room
      const saveRes = await fetch(`/api/rooms/${roomCode}/reflections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          subject: selectedSubject,
          subjectColor: selectedSubjectColor,
          text1,
          aiQuestion,
          aiHint,
          text2: secondInput,
          depthLevel,
        }),
      });

      if (!saveRes.ok) throw new Error("저장 실패");
      const saveData = await saveRes.json();
      const newRef: Reflection = saveData.reflection;

      // 3. Check Badge Unlock
      const newTotal = previousCount + 1;
      const targetBadge = BADGES.find((b) => b.count === newTotal);
      if (targetBadge) {
        setUnlockedBadge(targetBadge);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (_) {}
      } else {
        setUnlockedBadge(null);
      }

      onComplete(newRef);
      setStep("complete");
    } catch (err: any) {
      onRequestAlert(err?.message || "저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      setStep(2);
    }
  };

  const handleStep2Submit = () => {
    const trimmed = text2.trim();
    if (trimmed.length < 5) {
      onRequestAlert("질문에 대한 내 생각을 조금 더 구체적으로 적어주세요. (최소 5자 이상)");
      return;
    }
    handleFinishReflection(trimmed);
  };

  const handleStep2Skip = () => {
    handleFinishReflection("");
  };

  return (
    <div id="reflection-flow-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Back Button */}
      {step !== "complete" && (
        <div className="flex items-center justify-between">
          <button
            id="flow-back-btn"
            type="button"
            onClick={onBackToHome}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-semibold text-xs sm:text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>목록으로 돌아가기</span>
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      {step !== "complete" && (
        <div id="progress-indicator-row" className="flex items-center justify-center gap-3 py-2">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                step === 1 || step === 2 || step === "loading"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              1
            </div>
            <span className="text-[11px] font-bold text-sky-700 mt-1">첫 기록</span>
          </div>

          <div className="w-16 sm:w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-sky-600 transition-all duration-500 ${
                step === 2 ? "w-full" : "w-0"
              }`}
            />
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                step === 2
                  ? "bg-sky-600 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              2
            </div>
            <span
              className={`text-[11px] font-bold mt-1 ${
                step === 2 ? "text-sky-700" : "text-slate-400"
              }`}
            >
              한 걸음 더
            </span>
          </div>
        </div>
      )}

      {/* Step 1: Initial Reflection Form */}
      {step === 1 && (
        <div
          id="step-1-card"
          className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-7 space-y-5 animate-in fade-in"
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-2.5">
              1. 어떤 과목을 배웠나요?
            </h2>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map((sub) => {
                const isSelected = selectedSubject === sub.name;
                return (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => handleSelectSubject(sub.name)}
                    className={`px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold transition active:scale-95 ${
                      isSelected
                        ? sub.activeColor
                        : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                2. 배움 기록하기
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {text1.length}자 (최소 10자)
              </span>
            </div>
            <textarea
              id="reflection-text1-input"
              rows={4}
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              placeholder="오늘 이 과목에서 어떤 내용을 배웠나요? 핵심 개념과 배운 과정을 자유롭게 적어보세요. (예: 분수의 나눗셈을 배웠다. 나누기를 곱하기로 바꾸고 뒤의 분수를 뒤집으면 된다고 한다.)"
              className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none transition text-sm leading-relaxed text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="step1-next-btn"
              type="button"
              onClick={handleSubmitStep1}
              className="bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold py-3 px-6 rounded-xl shadow-md transition flex items-center gap-2 text-sm"
            >
              <span>AI 소크라테스 질문 받기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {step === "loading" && (
        <div
          id="flow-loading-card"
          className="bg-white rounded-2xl shadow-xs border border-slate-200 p-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Bot className="w-7 h-7 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">{loadingTitle}</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">{loadingDesc}</p>
          </div>
        </div>
      )}

      {/* Step 2: AI Socratic Question & Deeper Reflection */}
      {step === 2 && (
        <div id="step-2-card" className="space-y-4 animate-in fade-in">
          {/* Readonly First Note */}
          <div className="bg-slate-100/80 rounded-2xl p-4 sm:p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                나의 첫 기록 ({selectedSubject})
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold underline-offset-2 hover:underline"
              >
                수정하기
              </button>
            </div>
            <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-line">
              {text1}
            </p>
          </div>

          {/* AI Question Bubble */}
          <div className="flex gap-3 sm:gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-xs mt-1">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-sky-50/90 rounded-2xl rounded-tl-xs p-5 border border-sky-200 shadow-xs flex-1 relative">
              <span className="absolute -top-3 left-4 bg-white px-2.5 py-0.5 text-[10px] font-bold text-sky-700 rounded-full border border-sky-200 shadow-2xs">
                소크라테스 AI 질문
              </span>
              <p
                id="ai-question-text"
                className="text-slate-800 text-sm sm:text-base font-bold leading-relaxed pt-1"
              >
                "{aiQuestion}"
              </p>

              {isFallback && (
                <p className="text-[11px] text-amber-700 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  연결 상태에 따른 예시 질문으로 진행 중입니다.
                </p>
              )}

              {/* Hint Toggle */}
              {aiHint && (
                <div className="mt-3.5 pt-3 border-t border-sky-200/60">
                  <button
                    id="toggle-hint-btn"
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1.5 transition-colors focus:outline-none"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>{showHint ? "힌트 숨기기" : "생각하기 어렵다면 힌트 보기"}</span>
                  </button>

                  {showHint && (
                    <div
                      id="ai-hint-box"
                      className="mt-2.5 bg-white/95 rounded-xl p-3 border border-amber-200 text-xs text-slate-700 leading-relaxed shadow-inner flex items-start gap-2 animate-in fade-in"
                    >
                      <Quote className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="italic font-medium">{aiHint}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 2 Textarea */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                나의 생각 넓히기
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {text2.length}자
              </span>
            </div>

            <textarea
              id="reflection-text2-input"
              rows={4}
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder="위 AI 질문에 대한 나의 생각, 이유, 실생활과 연결되는 경험, 또는 새로운 적용점을 자유롭게 적어보세요."
              className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none transition text-sm leading-relaxed text-slate-800 placeholder:text-slate-400"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                id="step2-skip-btn"
                type="button"
                onClick={handleStep2Skip}
                className="text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition active:scale-95"
              >
                추가 질문 건너뛰기
              </button>

              <button
                id="step2-complete-btn"
                type="button"
                onClick={handleStep2Submit}
                className="bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold py-3 px-6 rounded-xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm"
              >
                <Check className="w-4 h-4" />
                <span>성찰 기록 완료</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete View */}
      {step === "complete" && (
        <div
          id="flow-complete-card"
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-xs">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1.5">
              성찰 기록 완료!
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              오늘도 질문을 통해 배움이 한 뼘 더 깊어졌어요.
            </p>

            {unlockedBadge && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 inline-flex flex-col items-center animate-bounce shadow-xs">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  새로운 배지 획득!
                </span>
                <span className="text-base font-extrabold text-amber-900">
                  🎉 '{unlockedBadge.name}' ({unlockedBadge.count}회 달성)
                </span>
              </div>
            )}
          </div>

          <button
            id="flow-return-home-btn"
            type="button"
            onClick={onBackToHome}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-md transition active:scale-95 text-sm"
          >
            기록 목록으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};
