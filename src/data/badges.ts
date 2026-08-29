import { BadgeInfo } from "../types";

export const BADGES: BadgeInfo[] = [
  {
    count: 1,
    name: "첫 걸음",
    description: "첫 번째 배움 성찰을 완료했습니다.",
    iconName: "Footprints",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    count: 10,
    name: "성장의 씨앗",
    description: "10번의 성찰로 배움의 싹을 틔웠습니다.",
    iconName: "Sprout",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    count: 50,
    name: "피어나는 꽃",
    description: "50번의 성찰로 배움의 꽃을 피웠습니다.",
    iconName: "Flower2",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  {
    count: 100,
    name: "탐스러운 열매",
    description: "100번의 성찰로 풍성한 결실을 맺었습니다.",
    iconName: "Apple",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  {
    count: 150,
    name: "단단한 나무",
    description: "150번의 성찰로 흔들리지 않는 나무가 되었습니다.",
    iconName: "Trees",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    count: 200,
    name: "지혜의 숲",
    description: "200번의 깊은 성찰로 울창한 지혜의 숲을 이뤘습니다.",
    iconName: "Mountain",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
  },
];

export const SUBJECT_OPTIONS: { name: import("../types").SubjectType; color: string; activeColor: string }[] = [
  { name: "국어", color: "text-rose-600 border-rose-200 hover:bg-rose-50", activeColor: "bg-rose-500 text-white border-rose-500 shadow-sm" },
  { name: "수학", color: "text-blue-600 border-blue-200 hover:bg-blue-50", activeColor: "bg-blue-500 text-white border-blue-500 shadow-sm" },
  { name: "사회", color: "text-orange-600 border-orange-200 hover:bg-orange-50", activeColor: "bg-orange-500 text-white border-orange-500 shadow-sm" },
  { name: "과학", color: "text-emerald-600 border-emerald-200 hover:bg-emerald-50", activeColor: "bg-emerald-500 text-white border-emerald-500 shadow-sm" },
  { name: "영어", color: "text-violet-600 border-violet-200 hover:bg-violet-50", activeColor: "bg-violet-500 text-white border-violet-500 shadow-sm" },
  { name: "기타", color: "text-slate-600 border-slate-200 hover:bg-slate-50", activeColor: "bg-slate-500 text-white border-slate-500 shadow-sm" },
];

export const DEPTH_LABELS: Record<number, { label: string; desc: string; color: string; bg: string }> = {
  1: { label: "1단계: 사실", desc: "배운 사실 나열", color: "text-slate-700", bg: "bg-slate-100 text-slate-700 border-slate-200" },
  2: { label: "2단계: 이유", desc: "원리와 이유 설명", color: "text-sky-700", bg: "bg-sky-50 text-sky-700 border-sky-200" },
  3: { label: "3단계: 연결", desc: "실생활/개념 연결", color: "text-emerald-700", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  4: { label: "4단계: 적용", desc: "새로운 상황 적용 및 실천", color: "text-amber-700", bg: "bg-amber-50 text-amber-700 border-amber-200" },
};
