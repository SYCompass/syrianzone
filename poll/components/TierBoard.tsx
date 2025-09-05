"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import * as htmlToImage from "html-to-image";

type Candidate = { id: string; name: string; title?: string | null; imageUrl: string | null };

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

// (colors reserved for future capture feature)

// Public base path used when the app is hosted under a sub-path (e.g., /tierlist)
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function TierBoard({ initialCandidates, pollId, voteDay }: Props) {
  const [tiers, setTiers] = useState<Record<TierKey, Candidate[]>>({ S: [], A: [], B: [], C: [], D: [], F: [] });
  const [bank, setBank] = useState<Candidate[]>(initialCandidates);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tiersRef = useRef<HTMLDivElement>(null);
  const [submitStatus, setSubmitStatus] = useState<{ ok: boolean; message: string; description?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function createEmptyTiers(): Record<TierKey, Candidate[]> {
    return { S: [], A: [], B: [], C: [], D: [], F: [] };
  }

  useEffect(() => {
    const wsPath = `${BASE_PATH}/api/ws`;
    const url = new URL(wsPath, window.location.href);
    url.searchParams.set("channel", `poll:${pollId}:${voteDay}`);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(url.toString());
    ws.onmessage = (ev) => {
      // In a real app, merge deltas into ranking UI. Keeping minimal here.
      // console.log(JSON.parse(ev.data));
    };
    return () => ws.close();
  }, [pollId, voteDay]);

  useEffect(() => {
    if (!submitStatus) return;
    const id = setTimeout(() => setSubmitStatus(null), 5000);
    return () => clearTimeout(id);
  }, [submitStatus]);

  function moveCandidateTo(candidateId: string, target: TierKey | "bank") {
    // find candidate anywhere
    const fromTierKey = tierKeys.find((k) => tiers[k].some((c) => c.id === candidateId));
    const fromBank = bank.some((c) => c.id === candidateId);
    let candidate: Candidate | undefined;
    if (fromTierKey) candidate = tiers[fromTierKey].find((c) => c.id === candidateId);
    if (!candidate && fromBank) candidate = bank.find((c) => c.id === candidateId);
    if (!candidate) return;

    // remove from previous location
    setTiers((t) => {
      const copy: Record<TierKey, Candidate[]> = { ...t };
      for (const k of tierKeys) copy[k] = copy[k].filter((c) => c.id !== candidateId);
      return copy;
    });
    setBank((b) => b.filter((c) => c.id !== candidateId));

    // add to target
    if (target === "bank") {
      setBank((b) => [...b, candidate!]);
    } else {
      setTiers((t) => ({ ...t, [target]: [...t[target], candidate!] }));
    }
    setSelectedId(null);
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
      // Reset: move ALL candidates back to bank and clear tiers
      setBank(initialCandidates);
      setTiers(createEmptyTiers());
      setSelectedId(null);
      setIsSubmitting(false);
    }
  }

  async function saveImage() {
    if (!tiersRef.current) return;
    const src = tiersRef.current;

    // Ensure all images inside the capture area are fully loaded
    const images = Array.from(src.querySelectorAll("img"));
    await Promise.all(
      images.map((img) =>
        img.complete && img.naturalWidth !== 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            })
      )
    );

    // Use the live node to avoid lazy-loading/offscreen clone issues.
    const contentWidth = Math.ceil(src.scrollWidth || src.offsetWidth);
    const contentHeight = Math.ceil(src.scrollHeight || src.offsetHeight);

    await (document as any).fonts?.ready;
    const dataUrl = await htmlToImage.toPng(src, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      width: contentWidth,
      height: contentHeight,
      skipFonts: true,
      fetchRequestInit: { mode: "cors", credentials: "omit", cache: "no-store" },
      style: {
        backgroundColor: "#ffffff",
      },
    });
    const link = document.createElement("a");
    link.download = "tierlist.png";
    link.href = dataUrl;
    link.click();
  }

  return (
    <Card ref={containerRef} className="max-w-screen-lg mx-auto p-4" data-capture-root>
      {/* <CardHeader> */}
        {/* <p className="text-center">اسحب وافلت الأسماِء ضمن S/A/B/C/D/F ثم اضغط إرسال</p> */}
      {/* </CardHeader> */}
      <div
        className="mb-4 p-2 bg-gray-100 border rounded"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, "bank")}
        data-bank-area
      >
        <h2 className="font-bold text-center">قائمة الوزراء</h2>
        <div className="flex flex-wrap justify-center gap-2 p-2">
          {bank.map((c) => {
            const selected = selectedId === c.id;
            return (
              <Button
                key={c.id}
                draggable
                onDragStart={(e) => handleDragStart(e, c.id)}
                onClick={() => setSelectedId(selected ? null : c.id)}
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
              onClick={() => selectedId && moveCandidateTo(selectedId, k)}
            >
              {tiers[k].map((c) => {
                const selected = selectedId === c.id;
                return (
                  <Button
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(selected ? null : c.id);
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
        <Button onClick={submit} disabled={isSubmitting}>إرسال</Button>
        <Button variant="secondary" onClick={saveImage} disabled={isSubmitting}>حفظ كصورة</Button>
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



