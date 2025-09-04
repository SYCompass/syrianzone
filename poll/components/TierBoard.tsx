"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

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

// Hex colors for safe capture (Tailwind equivalents)
const tierHex: Record<TierKey, { label: string; area: string; border: string }> = {
  S: { label: "#e11d48", area: "#fff1f2", border: "#fecdd3" },
  A: { label: "#d97706", area: "#fffbeb", border: "#fde68a" },
  B: { label: "#059669", area: "#ecfdf5", border: "#a7f3d0" },
  C: { label: "#0284c7", area: "#f0f9ff", border: "#bae6fd" },
  D: { label: "#7c3aed", area: "#f5f3ff", border: "#ddd6fe" },
  F: { label: "#1f2937", area: "#f3f4f6", border: "#d1d5db" },
};

export default function TierBoard({ initialCandidates, pollId, voteDay }: Props) {
  const [tiers, setTiers] = useState<Record<TierKey, Candidate[]>>({ S: [], A: [], B: [], C: [], D: [], F: [] });
  const [bank, setBank] = useState<Candidate[]>(initialCandidates);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [submitStatus, setSubmitStatus] = useState<{ ok: boolean; message: string; description?: string } | null>(null);

  useEffect(() => {
    const url = new URL(window.location.origin + "/api/ws");
    url.searchParams.set("channel", `poll:${pollId}:${voteDay}`);
    const ws = new WebSocket(url);
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
      const copy: Record<TierKey, Candidate[]> = { ...t } as any;
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
    // Prevent submitting if not all candidates are tierlisted
    const remaining = bank.length;
    if (remaining > 0) {
      setSubmitStatus({
        ok: false,
        message: "يرجى توزيع جميع الأسماء قبل الإرسال",
        description: `المتبقي: ${remaining} في قائمة الوزراء` ,
      });
      return;
    }

    const cfToken = (document.getElementById("cf-turnstile-token") as HTMLInputElement | null)?.value || "";
    const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
    const payload = {
      pollSlug: "best-ministers",
      cfToken,
      deviceId,
      tiers: Object.fromEntries(
        tierKeys.map((k) => [k, tiers[k].map((c, idx) => ({ candidateId: c.id, pos: idx }))])
      ),
    } as any;
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) setSubmitStatus({ ok: false, message: "حدث خطأ أو تم التصويت اليوم" });
    else setSubmitStatus({ ok: true, message: "تم تسجيل التصويت" });
  }

  async function saveImage() {
    if (!containerRef.current) return;
    const src = containerRef.current;

    // Measure full content size
    const contentWidth = Math.ceil(src.scrollWidth || src.offsetWidth);
    const contentHeight = Math.ceil(src.scrollHeight || src.offsetHeight);
    const pad = 16; // add padding to avoid edge cropping

    // Create offscreen wrapper and clone
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.left = "-100000px";
    wrapper.style.backgroundColor = "#ffffff";
    wrapper.style.padding = `${pad}px`;
    wrapper.style.width = `${contentWidth + pad * 2}px`;
    wrapper.style.height = `${contentHeight + pad * 2}px`;
    wrapper.style.boxSizing = "border-box";

    const clone = src.cloneNode(true) as HTMLElement;
    clone.style.margin = "0"; // prevent mx-auto centering from affecting layout
    clone.style.width = `${contentWidth}px`;
    clone.style.height = `${contentHeight}px`;
    clone.style.maxWidth = "none";
    clone.setAttribute("data-capture-root", "");
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
      await (document as any).fonts?.ready;
      const dataUrl = await htmlToImage.toPng(wrapper, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        width: contentWidth + pad * 2,
        height: contentHeight + pad * 2,
        style: {
          width: `${contentWidth + pad * 2}px`,
          height: `${contentHeight + pad * 2}px`,
          backgroundColor: "#ffffff",
        },
      });
      const link = document.createElement("a");
      link.download = "tierlist.png";
      link.href = dataUrl;
      link.click();
    } finally {
      document.body.removeChild(wrapper);
    }
  }

  return (
    <Card ref={containerRef as any} className="max-w-screen-lg mx-auto p-4" data-capture-root>
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

      <div className="flex gap-3 justify-center mt-6 p-4">
        <Button onClick={submit}>إرسال</Button>
        <Button variant="secondary" onClick={saveImage}>حفظ كصورة</Button>
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



