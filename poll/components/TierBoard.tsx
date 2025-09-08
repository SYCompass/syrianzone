"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import { exportTierListImage } from "@/lib/exportImage";

type Candidate = { id: string; name: string; title?: string | null; imageUrl: string | null; category?: string | null };

type Props = {
  initialCandidates: Candidate[];
  pollId: string;
  voteDay: string;
};

type TierKey = "S" | "A" | "B" | "C" | "D" | "F";

const tierKeys: TierKey[] = ["S", "A", "B", "C", "D", "F"];

const tierStyles: Record<TierKey, { label: string; area: string; border: string }> = {
  S: { label: "bg-rose-600", area: "bg-rose-50", border: "border-rose-200" },
  A: { label: "bg-amber-600", area: "bg-amber-50", border: "border-amber-200" },
  B: { label: "bg-emerald-600", area: "bg-emerald-50", border: "border-emerald-200" },
  C: { label: "bg-sky-600", area: "bg-sky-50", border: "border-sky-200" },
  D: { label: "bg-violet-600", area: "bg-violet-50", border: "border-violet-200" },
  F: { label: "bg-gray-800", area: "bg-gray-100", border: "border-gray-300" },
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function TierBoard({ initialCandidates, pollId, voteDay }: Props) {
  const [tiers, setTiers] = useState<Record<TierKey, Candidate[]>>({ S: [], A: [], B: [], C: [], D: [], F: [] });
  // Deterministic seeded shuffle to avoid SSR/CSR hydration mismatch
  const shuffledInitial = useMemo(() => {
    function xmur3(str: string): number {
      let h = 1779033703 ^ str.length;
      for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
      }
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    }
    function mulberry32(a: number) {
      return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const seedStr = `${pollId}|${voteDay}`;
    const rng = mulberry32(xmur3(seedStr));
    const copy = [...initialCandidates];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [initialCandidates, pollId, voteDay]);
  const [bank, setBank] = useState<Candidate[]>(() => shuffledInitial.filter((c) => c.category !== "governor"));
  const [selectedCategory, setSelectedCategory] = useState<"minister" | "governor">("minister");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const tiersRef = useRef<HTMLDivElement>(null);
  const [submitStatus, setSubmitStatus] = useState<{ ok: boolean; message: string; description?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextSubmitAt, setNextSubmitAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  const cooldownKey = `submitCooldown:${pollId}:${voteDay}`;

  

  function createEmptyTiers(): Record<TierKey, Candidate[]> {
    return { S: [], A: [], B: [], C: [], D: [], F: [] };
  }

  useEffect(() => {
    const wsPath = `${BASE_PATH}/api/ws`;
    const url = new URL(wsPath, window.location.href);
    url.searchParams.set("channel", `poll:${pollId}:${voteDay}`);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(url.toString());
    ws.onmessage = () => {};
    return () => ws.close();
  }, [pollId, voteDay]);

  useEffect(() => {
    const stored = localStorage.getItem(cooldownKey);
    if (stored) {
      const ts = parseInt(stored, 10);
      if (!Number.isNaN(ts) && ts > Date.now()) {
        setNextSubmitAt(ts);
      } else if (!Number.isNaN(ts)) {
        localStorage.removeItem(cooldownKey);
      }
    }
  }, []);

  useEffect(() => {
    if (!nextSubmitAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nextSubmitAt]);

  useEffect(() => {
    if (nextSubmitAt && now >= nextSubmitAt) {
      setNextSubmitAt(null);
      localStorage.removeItem(cooldownKey);
    }
  }, [now, nextSubmitAt, cooldownKey]);

  useEffect(() => {
    if (!submitStatus) return;
    const id = setTimeout(() => setSubmitStatus(null), 5000);
    return () => clearTimeout(id);
  }, [submitStatus]);

  // Switch between categories for the bank (does not remove already placed items from tiers)
  useEffect(() => {
    const inTiers = new Set<string>(tierKeys.flatMap((k) => tiers[k].map((c) => c.id)));
    const filtered = shuffledInitial.filter(
      (c) => (c.category === (selectedCategory === "governor" ? "governor" : c.category)) && (selectedCategory === "governor" ? c.category === "governor" : c.category !== "governor")
    ).filter((c) => !inTiers.has(c.id));
    setBank(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, tiers, shuffledInitial]);

  function moveCandidateTo(candidateId: string, target: TierKey | "bank") {
    const fromTierKey = tierKeys.find((k) => tiers[k].some((c) => c.id === candidateId));
    const fromBank = bank.some((c) => c.id === candidateId);
    let candidate: Candidate | undefined;
    if (fromTierKey) candidate = tiers[fromTierKey].find((c) => c.id === candidateId);
    if (!candidate && fromBank) candidate = bank.find((c) => c.id === candidateId);
    if (!candidate) return;

    setTiers((t) => {
      const copy: Record<TierKey, Candidate[]> = { ...t };
      for (const k of tierKeys) copy[k] = copy[k].filter((c) => c.id !== candidateId);
      return copy;
    });
    setBank((b) => b.filter((c) => c.id !== candidateId));

    if (target === "bank") {
      setBank((b) => [...b, candidate!]);
    } else {
      setTiers((t) => ({ ...t, [target]: [...t[target], candidate!] }));
    }
  }

  function moveCandidatesTo(candidateIds: string[], target: TierKey | "bank") {
    const idSet = new Set(candidateIds);
    const found: Candidate[] = [
      ...tierKeys.flatMap((k) => tiers[k].filter((c) => idSet.has(c.id))),
      ...bank.filter((c) => idSet.has(c.id)),
    ];
    setTiers((prev) => {
      const copy: Record<TierKey, Candidate[]> = { ...prev } as Record<TierKey, Candidate[]>;
      for (const k of tierKeys) copy[k] = copy[k].filter((c) => !idSet.has(c.id));
      if (target !== "bank") copy[target] = [...copy[target], ...found];
      return copy;
    });
    setBank((prev) => {
      const filtered = prev.filter((c) => !idSet.has(c.id));
      return target === "bank" ? [...filtered, ...found] : filtered;
    });
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const isInBank = bank.some((c) => c.id === id);
      if (!isInBank) return prev;
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDrop(e: React.DragEvent, target: TierKey | "bank") {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveCandidateTo(id, target);
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  async function submit() {
    const totalAssigned = tierKeys.reduce((acc, k) => acc + tiers[k].length, 0);
    if (totalAssigned < 3) {
      setSubmitStatus({ ok: false, message: "الحد الأدنى للاختيار هو ٣. الرجاء اختيار ٣ على الأقل." });
      return;
    }
    if (nextSubmitAt && Date.now() < nextSubmitAt) {
      const seconds = Math.ceil((nextSubmitAt - Date.now()) / 1000);
      const minutes = Math.floor(seconds / 60);
      const rem = seconds % 60;
      setSubmitStatus({ ok: false, message: `الرجاء الانتظار ${minutes}:${rem.toString().padStart(2, "0")} قبل إرسال تصويت آخر` });
      return;
    }
    setIsSubmitting(true);
    const cfToken = (document.getElementById("cf-turnstile-token") as HTMLInputElement | null)?.value || "";
    const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
    const payload: {
      pollSlug: string;
      cfToken: string;
      deviceId: string;
      tiers: Record<TierKey, Array<{ candidateId: string; pos: number }>>;
    } = {
      pollSlug: "best-ministers",
      cfToken,
      deviceId,
      tiers: tierKeys.reduce((acc, k) => {
        acc[k] = tiers[k].map((c, idx) => ({ candidateId: c.id, pos: idx }));
        return acc;
      }, {
        S: [] as Array<{ candidateId: string; pos: number }>,
        A: [] as Array<{ candidateId: string; pos: number }>,
        B: [] as Array<{ candidateId: string; pos: number }>,
        C: [] as Array<{ candidateId: string; pos: number }>,
        D: [] as Array<{ candidateId: string; pos: number }>,
        F: [] as Array<{ candidateId: string; pos: number }>,
      } as Record<TierKey, Array<{ candidateId: string; pos: number }>>),
    };
    const submitPath = `${BASE_PATH}/api/submit`;
    const res = await fetch(submitPath, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setSubmitStatus({ ok: false, message: "حدث خطأ أو تم التصويت اليوم" });
      setIsSubmitting(false);
    } else {
      setSubmitStatus({ ok: true, message: "تم تسجيل التصويت" });
      const ts = Date.now() + 1 * 60 * 1000;
      setNextSubmitAt(ts);
      localStorage.setItem(cooldownKey, String(ts));
      setIsSubmitting(false);
    }
  }

  async function saveImage() {
    if (!tiersRef.current) return;
    const appEl = containerRef.current;
    const maxWidthStyle = appEl ? window.getComputedStyle(appEl).maxWidth : "";
    const targetWidthCss = maxWidthStyle && maxWidthStyle !== "none" ? maxWidthStyle : "1000px";
    const targetWidth = parseInt(targetWidthCss, 10) || 1000;
    await exportTierListImage({
      container: tiersRef.current,
      targetWidthPx: targetWidth,
      basePath: BASE_PATH,
      watermarkText: "syrian.zone/tierlist",
      fileName: "tier-list.png",
      scale: 2,
    });
  }

  return (
    <Card ref={containerRef} className="max-w-screen-lg mx-auto p-4" data-capture-root>
      <div
        className="mb-4 p-2 bg-gray-100 border rounded"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, "bank")}
        data-bank-area
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-center flex-1">قائمة المسؤولين</h2>
          <div className="text-sm flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="category"
                value="minister"
                checked={selectedCategory === "minister"}
                onChange={() => setSelectedCategory("minister")}
              />
              الحكومة
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="category"
                value="governor"
                checked={selectedCategory === "governor"}
                onChange={() => setSelectedCategory("governor")}
              />
              المحافظون
            </label>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 p-2">
          {bank.map((c) => {
            const selected = selectedIds.has(c.id);
            return (
              <Button
                key={c.id}
                draggable
                onDragStart={(e) => handleDragStart(e, c.id)}
                onClick={(e) => { e.stopPropagation(); toggleSelected(c.id); }}
                className={`flex flex-col items-center gap-1 outline ${selected ? "!bg-gray-900 hover:!bg-gray-900 !text-white outline-2 outline-white" : "outline-none"} w-[120px]`}
                data-selected={selected ? "1" : undefined}
                disabled={isSubmitting}
              >
                <Avatar src={c.imageUrl || ""} alt={c.name} size={48} className="mb-1" />
                <span className="text-xs text-center leading-tight">{c.name}</span>
                {c.title ? (
                  <span className={`text-[11px] text-gray-600 text-center leading-tight ${selected ? "!text-white" : ""}`}>{c.title}</span>
                ) : null}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mb-3 text-sm text-gray-700 text-center flex flex-wrap gap-2 items-center justify-center">
        <span className="font-semibold">شرح المستويات:</span>
        <span className="inline-flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md text-white bg-rose-600 font-semibold">S</span>
          <span>ممتاز</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md text-white bg-amber-600 font-semibold">A</span>
          <span>جيد جدًا</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md text-white bg-emerald-600 font-semibold">B</span>
          <span>جيد</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md text-white bg-sky-600 font-semibold">C</span>
          <span>مقبول</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md text-white bg-violet-600 font-semibold">D</span>
          <span>ضعيف</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md text-white bg-gray-800 font-semibold">F</span>
          <span>سيئ</span>
        </span>
      </div>

      <div ref={tiersRef} data-capture-target>
        {tierKeys.map((k) => (
          <div key={k} className="flex mb-1">
            <div data-tier-label={k} className={`w-20 min-h-[165px] ${tierStyles[k].label} text-white text-xl font-bold flex items-center justify-center rounded-r`}>
              {k}
            </div>
            <div
              data-tier-area={k}
              className={`flex flex-wrap justify-center min-h-[165px] flex-grow p-2 border-2 border-dashed ${tierStyles[k].border} ${tierStyles[k].area} rounded-l`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, k)}
              onClick={() => {
                if (selectedIds.size > 0) moveCandidatesTo(Array.from(selectedIds), k);
              }}
            >
              {tiers[k].map((c) => {
                const selected = selectedIds.has(c.id);
                return (
                  <Button
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className={`flex flex-col items-center gap-1 mr-2 mb-2 outline ${selected ? "!bg-gray-900 hover:!bg-gray-900 !text-white outline-2 outline-white" : "outline-none"} w-[120px]`}
                    data-selected={selected ? "1" : undefined}
                    disabled={isSubmitting}
                  >
                    <Avatar src={c.imageUrl || ""} alt={c.name} size={48} className="mb-1" />
                    <span className="text-xs text-center leading-tight">{c.name}</span>
                    {c.title ? (
                      <span className="text-[11px] text-gray-600 text-center leading-tight">{c.title}</span>
                    ) : null}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center mt-6 p-4">
        <Button type="button" variant="secondary" onClick={submit} disabled={isSubmitting}>إرسال</Button>
        <Button type="button" onClick={saveImage} disabled={isSubmitting}>حفظ كصورة</Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            setBank(shuffledInitial);
            setTiers(createEmptyTiers());
            setSelectedIds(new Set());
          }}
        >
          مسح الاختيارات
        </Button>
      </div>
      {submitStatus && (
        <div className="px-4 pb-2">
          <Alert variant={submitStatus.ok ? "default" : "destructive"}>
            {submitStatus.ok ? (
              <CheckCircle2Icon className="h-5 w-5" />
            ) : (
              <AlertCircleIcon className="h-5 w-5" />
            )}
            <AlertTitle>{submitStatus.message}</AlertTitle>
            {submitStatus.description ? (
              <AlertDescription>{submitStatus.description}</AlertDescription>
            ) : null}
          </Alert>
        </div>
      )}
    </Card>
  );
}



