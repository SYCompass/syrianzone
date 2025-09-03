"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

type Candidate = { id: string; name: string; imageUrl: string | null };

type Props = {
  initialCandidates: Candidate[];
  pollId: string;
  voteDay: string;
};

type TierKey = "S" | "A" | "B" | "C" | "D" | "F";

const tierKeys: TierKey[] = ["S", "A", "B", "C", "D", "F"];

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
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const width = Math.ceil(el.scrollWidth || el.offsetWidth);
    const height = Math.ceil(el.scrollHeight || el.offsetHeight);

    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      useCORS: true,
      foreignObjectRendering: false,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: Math.max(document.documentElement.scrollWidth, rect.left + width),
      windowHeight: Math.max(document.documentElement.scrollHeight, rect.top + height),
      width,
      height,
      onclone: (doc) => {
        doc.documentElement.classList.add("capture-safe");
        doc.body.classList.add("capture-safe");
        const root = doc.querySelector("[data-capture-root]") as HTMLElement | null;
        if (root) {
          root.classList.add("capture-safe");
          root.style.backgroundColor = "#ffffff";
        }
      },
      logging: false,
      removeContainer: true,
    });

    const link = document.createElement("a");
    link.download = "tierlist.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
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
      >
        <h2 className="font-bold text-center">قائمة الوزراء</h2>
        <div className="flex flex-wrap gap-2 p-2">
          {bank.map((c) => {
            const selected = selectedId === c.id;
            return (
              <Button
                key={c.id}
                draggable
                onDragStart={(e) => handleDragStart(e, c.id)}
                onClick={() => setSelectedId(selected ? null : c.id)}
                className={`flex items-center gap-2 outline ${selected ? "outline-2 outline-blue-600" : "outline-none"}`}
              >
                <Avatar src={c.imageUrl || ""} alt={c.name} size={36} />
                <span className="text-xs text-right max-w-[160px] leading-tight">{c.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {tierKeys.map((k) => (
        <div key={k} className="flex mb-1">
          <div className="w-20 min-h-[165px] bg-gray-700 text-white text-xl font-bold flex items-center justify-center rounded-r">
            {k}
          </div>
          <div
            className="flex flex-wrap min-h-[165px] flex-grow p-2 border-2 border-dashed border-gray-300 bg-gray-50 rounded-l"
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
                  className={`flex items-center gap-2 mr-2 mb-2 outline ${selected ? "outline-2 outline-blue-600" : "outline-none"}`}
                >
                  <Avatar src={c.imageUrl || ""} alt={c.name} size={36} />
                  <span className="text-xs text-right max-w-[160px] leading-tight">{c.name}</span>
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



