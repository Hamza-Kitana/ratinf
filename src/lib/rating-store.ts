import { useEffect, useState, useCallback } from "react";
import { clearAllImages, deleteImageRef } from "@/lib/image-store";

export const CRITERIA = [
  { key: "presence", label: "نسبة التواجد في السيرفر", icon: "📡" },
  { key: "gangs", label: "التعامل مع العصابات", icon: "🔫" },
  { key: "citizens", label: "التعامل مع المواطنين", icon: "🤝" },
  { key: "roleplay", label: "الرول بلاي", icon: "🎭" },
  { key: "character", label: "الشخصنة", icon: "👤" },
  { key: "aim", label: "الايم", icon: "🎯" },
  { key: "prestige", label: "الهيبة", icon: "👑" },
  { key: "impression", label: "اقتباس الشخصية", icon: "💬" },
] as const;

export type CriterionKey = typeof CRITERIA[number]["key"];

/** معايير عكسية: كل ما نقّلت القيمة = أحسن */
const INVERSE_CRITERIA = new Set<CriterionKey>(["character"]);

export function isInverseCriterion(key: CriterionKey): boolean {
  return INVERSE_CRITERIA.has(key);
}

/** القيمة المحسوبة للترتيب والمتوسط (10 - raw للمعايير العكسية) */
export function effectiveCriterionScore(key: CriterionKey, raw: number): number {
  return isInverseCriterion(key) ? 10 - raw : raw;
}

export type Character = {
  id: string;
  name: string;
  image: string;
  scores: Record<CriterionKey, number>;
  createdAt: number;
};

const KEY = "infinity_rate_characters_v1";

function defaultScores(): Record<CriterionKey, number> {
  return CRITERIA.reduce((acc, c) => ({ ...acc, [c.key]: 5 }), {} as Record<CriterionKey, number>);
}

function normalizeScores(scores: Partial<Record<CriterionKey, number>>): Record<CriterionKey, number> {
  return CRITERIA.reduce(
    (acc, c) => ({ ...acc, [c.key]: scores[c.key] ?? 5 }),
    {} as Record<CriterionKey, number>,
  );
}

function read(): Character[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Character[]).map((c) => ({
      ...c,
      scores: normalizeScores(c.scores),
    }));
  } catch {
    return [];
  }
}

function write(list: Character[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("infinity:rate:update"));
}

export function averageScore(c: Character): number {
  const vals = CRITERIA.map((cr) => effectiveCriterionScore(cr.key, c.scores[cr.key] ?? 0));
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export type ScoredCharacter = Character & { avg: number };

export type PodiumGroups = {
  first: ScoredCharacter[];
  second: ScoredCharacter[];
  third: ScoredCharacter[];
  rest: Array<ScoredCharacter & { displayRank: number }>;
};

function sameScore(a: number, b: number): boolean {
  return a.toFixed(1) === b.toFixed(1);
}

export function scoreAndSort(list: Character[]): ScoredCharacter[] {
  return [...list]
    .map((c) => ({ ...c, avg: averageScore(c) }))
    .sort((a, b) => b.avg - a.avg || a.createdAt - b.createdAt);
}

/** تجميع حسب مستوى النتيجة — يدعم أكثر من أول / ثاني / ثالث عند التعادل */
export function buildPodiumGroups(list: Character[]): PodiumGroups {
  const sorted = scoreAndSort(list);
  const tiers: ScoredCharacter[][] = [];

  for (const c of sorted) {
    const last = tiers[tiers.length - 1];
    if (last?.length && sameScore(last[0].avg, c.avg)) {
      last.push(c);
    } else {
      tiers.push([c]);
    }
  }

  const rest = tiers.slice(3).flatMap((members, tierOffset) => {
    const displayRank = tierOffset + 4;
    return members.map((c) => ({ ...c, displayRank }));
  });

  return {
    first: tiers[0] ?? [],
    second: tiers[1] ?? [],
    third: tiers[2] ?? [],
    rest,
  };
}

/** ترتيب كثيف: 1، 1، 2، 3... عند التعادل */
export function withDenseRank(list: Character[]): Array<ScoredCharacter & { rank: number }> {
  const sorted = scoreAndSort(list);
  let rank = 0;
  let prevAvg: number | null = null;

  return sorted.map((c) => {
    if (prevAvg === null || !sameScore(c.avg, prevAvg)) rank++;
    prevAvg = c.avg;
    return { ...c, rank };
  });
}

export function useCharacters() {
  const [list, setList] = useState<Character[]>([]);

  useEffect(() => {
    setList(read());
    const onUpdate = () => setList(read());
    window.addEventListener("infinity:rate:update", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("infinity:rate:update", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const addCharacter = useCallback((name: string, image: string) => {
    const next: Character = {
      id: crypto.randomUUID(),
      name,
      image,
      scores: defaultScores(),
      createdAt: Date.now(),
    };
    const all = [...read(), next];
    write(all);
    return next.id;
  }, []);

  const updateCharacter = useCallback((id: string, patch: { name: string; image: string }) => {
    const all = read();
    const current = all.find((c) => c.id === id);
    if (!current) return;

    if (current.image && current.image !== patch.image) {
      void deleteImageRef(current.image);
    }

    write(
      all.map((c) =>
        c.id === id ? { ...c, name: patch.name.trim(), image: patch.image } : c,
      ),
    );
  }, []);

  const updateScores = useCallback((id: string, scores: Record<CriterionKey, number>) => {
    const all = read().map((c) => (c.id === id ? { ...c, scores } : c));
    write(all);
  }, []);

  const remove = useCallback((id: string) => {
    const target = read().find((c) => c.id === id);
    if (target?.image) void deleteImageRef(target.image);
    write(read().filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    write([]);
    void clearAllImages();
  }, []);

  return { list, addCharacter, updateCharacter, updateScores, remove, clearAll };
}
