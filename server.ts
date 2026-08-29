import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { fileURLToPath } from "url";
import { Reflection, Room, GradeLevel, SubjectType } from "./src/types";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Storage File Path
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

// In-Memory Storage for Rooms and Reflections
const rooms = new Map<string, Room>();
const reflections = new Map<string, Reflection[]>();

const DEMO_ROOM_CODE = "DEMO1";
const DEFAULT_DEMO_ROOM: Room = {
  id: DEMO_ROOM_CODE,
  teacherName: "3학년 2반 김민지 선생님",
  targetGrade: "초등학교 4~6학년",
  createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString(),
};

const DEFAULT_DEMO_REFLECTIONS: Reflection[] = [
  {
    id: "demo-ref-1",
    roomCode: DEMO_ROOM_CODE,
    studentName: "김하늘",
    subject: "수학",
    subjectColor: "bg-blue-500",
    text1: "오늘 분수의 나눗셈을 배웠다. 나누기를 곱하기로 바꾸고 뒤의 분수를 위아래 뒤집으면 된다고 배웠다.",
    aiQuestion: "왜 나누기를 곱하기로 바꿀 때 뒤에 있는 분수의 분자와 분모를 뒤집어야 할까요?",
    aiHint: "예를 들어 2m짜리 끈을 1/2m씩 자르면 몇 도막이 나오는지 직접 세어보는 그림을 떠올려보세요.",
    text2: "피자 1판을 1/4조각씩 나누면 4조각이 나오는 것처럼, 분모가 작아질수록 들어갈 수 있는 조각 수가 늘어나기 때문에 역수를 곱하는 것과 같다는 걸 알게 되었다.",
    depthLevel: 4,
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
  {
    id: "demo-ref-2",
    roomCode: DEMO_ROOM_CODE,
    studentName: "이지우",
    subject: "사회",
    subjectColor: "bg-orange-500",
    text1: "조선 시대의 신분 제도에 대해 배웠다. 양반, 중인, 상민, 천민으로 나뉘어 있었다.",
    aiQuestion: "신분에 따라 맡은 일과 권리가 엄격하게 정해져 있던 사회는 오늘날 우리 사회와 어떤 차이가 있을까요?",
    aiHint: "오늘날 우리가 직업을 선택할 때 신분이 아닌 무엇을 기준으로 정하는지 생각해보세요.",
    text2: "신분에 얽매이지 않고 누구나 노력하면 원하는 직업을 가질 수 있는 현대 사회가 훨씬 평등하고 소중하다는 생각이 들었다.",
    depthLevel: 3,
    createdAt: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
  },
  {
    id: "demo-ref-3",
    roomCode: DEMO_ROOM_CODE,
    studentName: "박서준",
    subject: "과학",
    subjectColor: "bg-emerald-500",
    text1: "식물이 광합성을 할 때 햇빛, 물, 이산화탄소가 필요하고 산소와 양분을 만든다는 것을 실험으로 확인했다.",
    aiQuestion: "만약 지구상에 식물이 모두 사라진다면 동물과 인간의 호흡 및 먹이사슬에는 어떤 연쇄 반응이 일어날까요?",
    aiHint: "숲이 파괴되었을 때 공기 중 기체 비율과 동물들의 먹이에 생기는 변화를 상상해보세요.",
    text2: "산소가 줄어들어 숨쉬기 어려워질 뿐 아니라, 초식동물이 굶주려 생태계 전체가 무너질 것이다. 그래서 교실 화분도 잘 가꾸어야겠다.",
    depthLevel: 4,
    createdAt: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
  },
  {
    id: "demo-ref-4",
    roomCode: DEMO_ROOM_CODE,
    studentName: "최민서",
    subject: "국어",
    subjectColor: "bg-rose-500",
    text1: "글쓴이의 관점을 파악하며 글을 읽는 방법을 배웠다.",
    aiQuestion: "같은 사건이라도 글쓴이의 생각에 따라 기사나 글의 내용이 어떻게 달라질 수 있을까요?",
    aiHint: "운동회에서 우리 팀이 졌을 때와 상대 팀이 쓴 일기의 기분이 어떻게 다를지 비교해보세요.",
    text2: "자신의 입장에 따라 강조하는 부분이 다르므로 뉴스를 볼 때 한쪽 이야기만 믿지 않고 비판적으로 읽어야겠다.",
    depthLevel: 3,
    createdAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
  },
  {
    id: "demo-ref-5",
    roomCode: DEMO_ROOM_CODE,
    studentName: "정도현",
    subject: "영어",
    subjectColor: "bg-violet-500",
    text1: "과거 시제 표현인 -ed 규칙과 불규칙 동사들을 외웠다.",
    aiQuestion: "어제 있었던 가장 기억에 남는 일을 과거형 문장 2개로 표현해본다면 무엇인가요?",
    aiHint: "예를 들어 'I played soccer' 처럼 주어와 과거 동사를 넣어보세요.",
    text2: "I ate delicious pizza with my family yesterday.",
    depthLevel: 2,
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
];

// Load persisted data
function loadPersistedData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.rooms && Array.isArray(parsed.rooms)) {
        parsed.rooms.forEach((r: Room) => {
          if (r && r.id) rooms.set(r.id, r);
        });
      }
      if (parsed.reflections && typeof parsed.reflections === "object") {
        Object.entries(parsed.reflections).forEach(([code, list]) => {
          if (Array.isArray(list)) {
            reflections.set(code, list as Reflection[]);
          }
        });
      }
    }
  } catch (err) {
    console.warn("Failed to load persisted data:", err);
  }

  // Ensure DEMO1 exists
  if (!rooms.has(DEMO_ROOM_CODE)) {
    rooms.set(DEMO_ROOM_CODE, DEFAULT_DEMO_ROOM);
  }
  if (!reflections.has(DEMO_ROOM_CODE)) {
    reflections.set(DEMO_ROOM_CODE, DEFAULT_DEMO_REFLECTIONS);
  }
}

// Save persisted data
function savePersistedData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      rooms: Array.from(rooms.values()),
      reflections: Object.fromEntries(reflections.entries()),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save persisted data:", err);
  }
}

// Initialize data
loadPersistedData();

// Helper: Generate Gemini client
function getGeminiClient(customApiKey?: string) {
  const cleanCustom =
    customApiKey && typeof customApiKey === "string"
      ? customApiKey.trim().replace(/^["']|["']$/g, "").trim()
      : undefined;

  const apiKey = (cleanCustom && cleanCustom.length > 0) ? cleanCustom : process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey: apiKey.trim().replace(/^["']|["']$/g, ""),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1-1. Validate Custom Gemini API Key
app.post("/api/validate-key", async (req: Request, res: Response) => {
  const { apiKey } = req.body;
  const keyToTest = (apiKey && typeof apiKey === "string" ? apiKey : "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!keyToTest) {
    res.status(400).json({ valid: false, error: "API 키를 입력해주세요." });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: keyToTest,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
    // Test with a quick lightweight call
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hi",
    });
    if (response && response.text) {
      res.json({ valid: true, message: "유효한 Gemini API 키입니다." });
    } else {
      res.json({ valid: true, message: "Gemini API 연결 확인 완료" });
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("Custom API Key validation failed:", msg);
    const userFriendlyError = msg.includes("API key not valid") || msg.includes("INVALID_ARGUMENT")
      ? "입력하신 API 키가 유효하지 않습니다. Google AI Studio에서 생성한 키를 다시 확인해주세요."
      : msg.includes("PERMISSION_DENIED")
      ? "API 키 권한이 부족하거나 사용 제한된 키입니다."
      : `API 키 검증 실패: ${msg}`;
    res.status(400).json({ valid: false, error: userFriendlyError });
  }
});

// 2. Generate Room Code
function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 3. Create Room
app.post("/api/rooms", (req: Request, res: Response) => {
  try {
    const { teacherName, targetGrade, geminiApiKey } = req.body;

    if (!teacherName || typeof teacherName !== "string" || !teacherName.trim()) {
      res.status(400).json({ error: "선생님 성함 또는 학급명을 입력해주세요." });
      return;
    }

    let code = generateCode();
    let attempts = 0;
    while (rooms.has(code) && attempts < 10) {
      code = generateCode();
      attempts++;
    }

    const cleanKey =
      geminiApiKey && typeof geminiApiKey === "string"
        ? geminiApiKey.trim().replace(/^["']|["']$/g, "").trim()
        : undefined;

    const newRoom: Room = {
      id: code,
      teacherName: teacherName.trim(),
      targetGrade: (targetGrade as GradeLevel) || "초등학교 4~6학년",
      geminiApiKey: cleanKey && cleanKey.length > 0 ? cleanKey : undefined,
      createdAt: new Date().toISOString(),
    };

    rooms.set(code, newRoom);
    if (!reflections.has(code)) {
      reflections.set(code, []);
    }
    savePersistedData();

    res.json({ success: true, room: newRoom });
  } catch (err: any) {
    console.error("Create room exception:", err);
    res.status(500).json({ error: err?.message || "방 생성 중 서버 오류가 발생했습니다." });
  }
});

// 4. Get Room Info
app.get("/api/rooms/:code", (req: Request, res: Response) => {
  const code = (req.params.code || "").toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    res.status(404).json({ error: "존재하지 않거나 유효하지 않은 방 코드입니다." });
    return;
  }

  // Do not expose secret API key to client
  res.json({
    id: room.id,
    teacherName: room.teacherName,
    targetGrade: room.targetGrade,
    hasCustomApiKey: Boolean(room.geminiApiKey),
    createdAt: room.createdAt,
  });
});

// 5. Update Room Settings
app.patch("/api/rooms/:code", (req: Request, res: Response) => {
  const code = (req.params.code || "").toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    res.status(404).json({ error: "방을 찾을 수 없습니다." });
    return;
  }

  const { targetGrade, teacherName } = req.body;
  if (targetGrade) room.targetGrade = targetGrade;
  if (teacherName) room.teacherName = teacherName;
  savePersistedData();

  res.json({ success: true, room });
});

// 6. Get Reflections for a Room
app.get("/api/rooms/:code/reflections", (req: Request, res: Response) => {
  const code = (req.params.code || "").toUpperCase();
  const studentName = req.query.studentName as string | undefined;

  const room = rooms.get(code);
  if (!room) {
    res.status(404).json({ error: "방을 찾을 수 없습니다." });
    return;
  }

  const list = reflections.get(code) || [];
  if (studentName) {
    const filtered = list.filter((r) => r.studentName === studentName);
    res.json({ reflections: filtered });
    return;
  }

  res.json({ reflections: list });
});

// 7. Save a Reflection
app.post("/api/rooms/:code/reflections", (req: Request, res: Response) => {
  const code = (req.params.code || "").toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    res.status(404).json({ error: "방을 찾을 수 없습니다." });
    return;
  }

  const { studentName, subject, subjectColor, text1, aiQuestion, aiHint, text2, depthLevel } = req.body;

  if (!studentName || !subject || !text1) {
    res.status(400).json({ error: "필수 입력 항목이 누락되었습니다." });
    return;
  }

  const newRef: Reflection = {
    id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    roomCode: code,
    studentName: studentName.trim(),
    subject: subject as SubjectType,
    subjectColor: subjectColor || "bg-slate-500",
    text1: text1.trim(),
    aiQuestion: aiQuestion || "",
    aiHint: aiHint || "",
    text2: (text2 || "").trim(),
    depthLevel: (depthLevel >= 1 && depthLevel <= 4 ? depthLevel : 1) as 1 | 2 | 3 | 4,
    createdAt: new Date().toISOString(),
  };

  const list = reflections.get(code) || [];
  list.unshift(newRef);
  reflections.set(code, list);
  savePersistedData();

  res.json({ success: true, reflection: newRef });
});

// 8. Generate Socratic AI Question & Hint
app.post("/api/generate-question", async (req: Request, res: Response) => {
  const { roomCode, subject, text } = req.body;

  if (!subject || !text) {
    res.status(400).json({ error: "과목과 배움 기록을 전달해주세요." });
    return;
  }

  const code = (roomCode || "").toUpperCase();
  const room = rooms.get(code);
  const targetGrade = room?.targetGrade || "초등학교 4~6학년";
  const customApiKey = room?.geminiApiKey;

  const systemPrompt = `당신은 학생의 학습 성찰을 돕는 '건조하지만 예리한' 소크라테스식 AI 교사입니다.
현재 대상 학생은 **${targetGrade}**입니다.

규칙:
1. 학생이 입력한 '배움 기록'과 선택한 '과목'의 교육과정 특성을 바탕으로 질문을 생성하세요.
2. 칭찬, 평가, 인사, 감정 표현은 **절대 금지**합니다.
3. 성찰 깊이 중, 학생 글의 현재 단계보다 딱 '한 단계 더 깊은' 사고를 유도하는 질문이어야 합니다.
4. 반드시 질문은 **딱 한 문장 1개**만 생성하세요.
5. 학생이 대답하기 어려워할 경우를 대비해, 비유나 구체적 일상 예시가 포함된 '힌트' 문장도 1개 같이 생성하세요.
6. **[중요] 설정된 대상 학년(${targetGrade})의 인지 발달 수준과 어휘력에 정확히 맞춰 질문과 힌트의 난이도를 조절하세요.** 저학년(초1~3)은 일상적인 친숙한 단어를 쓰고, 고학년 및 중·고등학생은 개념적 연결을 자극하세요.
7. 응답은 지정된 JSON 스키마 형식으로만 반환하세요.

과목별 질문 방향 가이드:
- 수학: 공식 암기가 아닌 개념의 원리, 이유, 혹은 오류 가능성 묻기
- 사회: 단편적 사실이 아닌 실생활/현대 사회의 현상과 연결하기
- 과학: 결과 나열이 아닌 가설 추론, 변인 변경 시 나타날 결과 묻기
- 국어: 텍스트 요약이 아닌 작가의 의도나 나의 삶과 연결하기
- 영어: 단어 암기가 아닌 문화적 맥락이나 문장의 뉘앙스 차이 묻기
- 기타: 배운 내용이 나와 우리 주변에 주는 의미나 적용점 묻기`;

  const userPrompt = `과목: ${subject}\n학생 기록: ${text}`;

  try {
    const ai = getGeminiClient(customApiKey);
    if (!ai) {
      throw new Error("No Gemini API key available");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: "한 문장으로 된 소크라테스식 성찰 유도 질문",
            },
            hint: {
              type: Type.STRING,
              description: "학생이 생각하기 어려울 때 도움을 주는 예시나 비유가 담긴 힌트",
            },
          },
          required: ["question", "hint"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    if (parsed.question && parsed.hint) {
      res.json({ question: parsed.question, hint: parsed.hint, fallback: false });
      return;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Gemini Generate Question Error:", error);
    // Safe intelligent fallback
    let fallbackQ = "이 내용을 배운 후, 일상생활에서 비슷하게 적용하거나 연결해볼 수 있는 상황은 무엇이 있을까요?";
    let fallbackH = "주말에 마트에 가거나, 집에서 일어나는 일 중 비슷한 상황이 없었는지 떠올려보세요.";

    if (subject === "수학") {
      fallbackQ = "이 수학 공식이나 규칙이 왜 성립하는지 그림이나 비유로 설명해볼 수 있을까요?";
      fallbackH = "초콜릿 조각을 똑같이 나누거나 바둑돌을 배열하는 장면을 상상해보세요.";
    } else if (subject === "과학") {
      fallbackQ = "만약 실험 조건 중 하나를 반대로 바꾸면 어떤 새로운 결과가 나타날까요?";
      fallbackH = "온도를 훨씬 높이거나 햇빛을 차단했을 때 일어날 변화를 생각해보세요.";
    } else if (subject === "사회") {
      fallbackQ = "이 역사적 사건이나 제도가 오늘날 우리가 살아가는 모습에 어떤 영향을 주고 있을까요?";
      fallbackH = "오늘날 우리가 지키는 법이나 권리와 비교해보세요.";
    }

    res.json({
      question: fallbackQ,
      hint: fallbackH,
      fallback: true,
    });
  }
});

// 9. Classify Reflection Depth
app.post("/api/classify-depth", async (req: Request, res: Response) => {
  const { roomCode, subject, text1, text2 } = req.body;

  const code = (roomCode || "").toUpperCase();
  const room = rooms.get(code);
  const customApiKey = room?.geminiApiKey;

  const systemPrompt = `당신은 교사를 돕는 학습 성찰 채점 보조자입니다. 학생의 성찰문을 아래 '성찰 깊이 4단계' 기준 중 하나로 분류하세요.
1단계(사실): 배운 내용을 사실 그대로 나열함 (단순 요약, 암기 사실 기술)
2단계(이유): 왜 그런지 이유나 원리를 설명함 (원리 이해, 인과 관계)
3단계(연결): 다른 개념이나 자신의 실생활 경험과 연결함 (맥락화, 비교)
4단계(적용): 배운 것을 새로운 상황에 적용하거나 구체적 실천 계획/의미를 제시함 (전이, 확장)

'첫 기록'과 '깊은 성찰'을 함께 종합 판단하여 1~4 중 하나의 정수 숫자로 반환하세요.`;

  const userPrompt = `과목: ${subject}\n첫 기록: ${text1}\n깊은 성찰: ${text2 || "(작성하지 않음)"}`;

  try {
    const ai = getGeminiClient(customApiKey);
    if (!ai) throw new Error("No API Key");

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: {
              type: Type.INTEGER,
              description: "1부터 4 사이의 성찰 깊이 단계",
            },
          },
          required: ["level"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const level = Number(parsed.level);
    if (level >= 1 && level <= 4) {
      res.json({ level });
      return;
    }
    res.json({ level: text2 && text2.length > 5 ? 2 : 1 });
  } catch (error) {
    console.error("Classify depth error:", error);
    res.json({ level: text2 && text2.length > 10 ? 2 : 1 });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
