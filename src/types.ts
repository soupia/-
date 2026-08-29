export type SubjectType = '국어' | '수학' | '사회' | '과학' | '영어' | '기타';

export type GradeLevel =
  | '초등학교 1~3학년'
  | '초등학교 4~6학년'
  | '중학생'
  | '고등학생';

export interface Reflection {
  id: string;
  roomCode: string;
  studentName: string;
  subject: SubjectType;
  subjectColor: string;
  text1: string;
  aiQuestion: string;
  aiHint?: string;
  text2: string;
  depthLevel: 1 | 2 | 3 | 4;
  createdAt: string;
}

export interface Room {
  id: string; // 5-letter code e.g. A3F9K
  teacherName: string;
  targetGrade: GradeLevel;
  geminiApiKey?: string;
  createdAt: string;
}

export interface BadgeInfo {
  count: number;
  name: string;
  description: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface RoomStats {
  total: number;
  depthCounts: [number, number, number, number];
  mostActiveSubject: string;
  turn2Rate: number;
  subjectAvg: { subject: SubjectType; avg: number; count: number }[];
  studentCount: number;
}

export interface StudentSummary {
  name: string;
  total: number;
  avgDepth: number;
  turn2Rate: number;
  lastActive: string;
  items: Reflection[];
}
