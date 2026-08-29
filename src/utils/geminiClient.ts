// Client-side Direct Google Gemini API helper for Vercel, GitHub Pages, and Fullstack deployments
import { GradeLevel, SubjectType } from "../types";

export interface KeyValidationResult {
  valid: boolean;
  message: string;
  isDirect?: boolean;
}

export function sanitizeApiKey(key: string): string {
  if (!key || typeof key !== "string") return "";
  return key.trim().replace(/^["']|["']$/g, "").trim();
}

/**
 * Validates a Gemini API Key either via backend proxy (/api/validate-key)
 * or directly via Google Generative Language REST API (for Vercel / GitHub Pages static deployments).
 */
export async function validateGeminiApiKey(rawKey: string): Promise<KeyValidationResult> {
  const cleanKey = sanitizeApiKey(rawKey);

  if (!cleanKey) {
    return { valid: false, message: "검증할 Gemini API 키를 입력해주세요." };
  }

  // Pre-check obvious format issue
  if (!cleanKey.startsWith("AIzaSy") && cleanKey.length < 20) {
    return {
      valid: false,
      message: "Gemini API 키는 보통 'AIzaSy'로 시작하는 약 39자리 문자열입니다. 키를 다시 확인해주세요.",
    };
  }

  // 1. Try Backend Proxy (/api/validate-key)
  try {
    const res = await fetch("/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: cleanKey }),
    });

    // If backend endpoint is live and returned JSON
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (res.ok && data.valid) {
        return { valid: true, message: "Google AI Studio에서 정상 인증된 Gemini API 키입니다." };
      } else if (!res.ok && data.error) {
        return { valid: false, message: data.error };
      }
    }
  } catch (_) {
    // If backend is unavailable (e.g. Vercel static deployment), proceed to direct Google API call
  }

  // 2. Direct Google Generative Language REST API validation (Guaranteed on Vercel / GitHub Pages)
  try {
    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const directRes = await fetch(directUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });

    if (directRes.ok) {
      return {
        valid: true,
        message: "Google AI Studio에서 정상 인증되었습니다. (Vercel/GitHub 호환)",
        isDirect: true,
      };
    }

    // Parse Google API error details
    const errData = await directRes.json().catch(() => ({}));
    const rawMsg = errData?.error?.message || "";

    if (rawMsg.includes("API key not valid") || directRes.status === 400 || directRes.status === 403) {
      return {
        valid: false,
        message: "유효하지 않은 API 키입니다. Google AI Studio(aistudio.google.com)에서 발급받은 'AIzaSy...' 키인지 확인해주세요.",
      };
    }

    if (rawMsg.includes("RESOURCE_EXHAUSTED") || directRes.status === 429) {
      return {
        valid: false,
        message: "API 키 사용 한도(Quota)가 초과되었습니다. Google AI Studio 콘솔에서 확인해주세요.",
      };
    }

    return {
      valid: false,
      message: `Google Gemini API 인증 실패 (${directRes.status}): ${rawMsg || "키 상태를 확인해주세요."}`,
    };
  } catch (netErr: any) {
    if (!cleanKey.startsWith("AIzaSy")) {
      return {
        valid: false,
        message: "Gemini API 키는 보통 'AIzaSy'로 시작합니다. 올바른 키를 입력했는지 확인해주세요.",
      };
    }
    return {
      valid: false,
      message: "네트워크 통신 중 오류가 발생했습니다. 브라우저의 인터넷 연결 또는 AdBlock 설정을 확인해주세요.",
    };
  }
}

/**
 * Direct Gemini API call for generating Socratic question
 */
export async function generateQuestionDirect(
  apiKey: string,
  subject: SubjectType,
  targetGrade: GradeLevel | string,
  studentText: string
): Promise<{ question: string; hint: string }> {
  const cleanKey = sanitizeApiKey(apiKey);
  const prompt = `당신은 ${targetGrade} 학생들의 깊은 사고를 돕는 초/중/고 전문 교사 '소크라테스 AI'입니다.
학생이 오늘 [${subject}] 시간에 배운 내용에 대해 성찰 기록을 남겼습니다.
학생 기록: "${studentText}"

[질문 생성 지침]
1. 단순 칭찬이나 답을 주는 설명은 배제하고, 학생의 호기심과 추론을 자극하는 '소크라테스식 발문(Question)' 1개와 생각의 실마리를 주는 '힌트(Hint)' 1개를 작성하세요.
2. 학생의 대상 학년(${targetGrade})의 인지 발달 및 어휘 수준에 정확히 맞추세요.
3. 다음 JSON 형식으로만 응답하세요:
{
  "question": "생각을 넓히는 질문 문장 (반드시 물음표로 끝남)",
  "hint": "학생이 생각을 시작할 수 있도록 돕는 힌트나 질문 예시"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API Error: ${res.status}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("No response from Gemini API");

  const parsed = JSON.parse(rawText);
  return {
    question: parsed.question || "이 내용을 일상생활에서 어떻게 적용해볼 수 있을까요?",
    hint: parsed.hint || "우리 주변의 경험과 비교해보세요.",
  };
}

/**
 * Direct Gemini API call for classifying reflection depth level (1~4)
 */
export async function classifyDepthDirect(
  apiKey: string,
  subject: SubjectType,
  text1: string,
  text2: string
): Promise<1 | 2 | 3 | 4> {
  const cleanKey = sanitizeApiKey(apiKey);
  const prompt = `당신은 학생의 배움성찰 기록을 1~4단계로 평가하는 교육 평가 AI입니다.

[성찰 깊이 4단계 기준]
1단계 (단순 사실): 수업 시간에 배운 내용, 개념, 사실을 단순히 요약하거나 언급함.
2단계 (이유/원리): '왜 그럴까?', 원리나 이유, 자신의 느낌과 생각을 덧붙임.
3단계 (연결/통찰): 이전에 배운 내용이나 다른 과목, 자신의 과거 경험과 연계하여 통찰을 도출함.
4단계 (적용/실천): 배운 지식을 새로운 문제 상황, 일상생활, 미래의 실천 계획으로 전이하여 적용함.

[학생 성찰 기록]
- 과목: ${subject}
- 1차 배움 기록: "${text1}"
- 2차 심화 생각: "${text2}"

위 기록의 종합적인 성찰 수준을 1, 2, 3, 4 중 하나로 판정하여 아래 JSON 형식으로만 응답하세요:
{
  "level": 1 | 2 | 3 | 4,
  "reason": "판정 이유 한 줄"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    return text2 && text2.trim().length > 0 ? 2 : 1;
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return text2 ? 2 : 1;

  const parsed = JSON.parse(rawText);
  const lvl = Number(parsed.level);
  if (lvl >= 1 && lvl <= 4) return lvl as 1 | 2 | 3 | 4;
  return text2 ? 2 : 1;
}
