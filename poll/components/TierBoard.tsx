"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import html2canvas from "html2canvas";

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
    // Clear visual selection
    setSelectedId(null);

    // Determine target width from container max-width or default
    const appEl = containerRef.current;
    const maxWidthStyle = appEl ? window.getComputedStyle(appEl).maxWidth : "";
    const targetWidthCss = maxWidthStyle && maxWidthStyle !== "none" ? maxWidthStyle : "1000px";
    const targetWidth = parseInt(targetWidthCss, 10) || 1000;

    // 1) Clone the tiers container
    const cloneContainer = src.cloneNode(true) as HTMLElement;
    cloneContainer.setAttribute("data-capture-export", "1");

    // 2) Style the clone for off-screen rendering at target width
    const srcPadding = window.getComputedStyle(src).padding;
    cloneContainer.style.position = "absolute";
    cloneContainer.style.left = "-9999px"; // off-screen
    cloneContainer.style.top = "0px";
    cloneContainer.style.width = `${targetWidth}px`;
    cloneContainer.style.height = "auto";
    cloneContainer.style.display = "block";
    cloneContainer.style.backgroundColor = "#ffffff";
    cloneContainer.style.padding = srcPadding;
    cloneContainer.style.boxShadow = "none";

    // Remove dashed borders from dropzones within the clone
    cloneContainer.querySelectorAll<HTMLElement>("[data-tier-area]").forEach((zone) => {
      zone.style.border = "1px solid #eee";
      zone.style.backgroundColor = "#fdfdfd";
      zone.style.borderStyle = "solid";
    });

    // Ensure items within the clone are styled consistently
    cloneContainer.querySelectorAll<HTMLElement>("button").forEach((item) => {
      item.style.width = "100px";
      item.style.height = "160px";
      item.style.padding = "5px";
      item.style.boxSizing = "border-box";
      item.style.border = "1px solid #ddd";
      item.style.borderRadius = "4px";
      item.style.backgroundColor = "#ffffff";
      item.style.display = "flex";
      item.style.flexDirection = "column";
      (item.style as any).justifyContent = "normal";
      item.style.alignItems = "center";
      item.style.overflow = "hidden";

      const img = item.querySelector("img") as HTMLImageElement | null;
      if (img) {
        img.style.width = "95px";
        img.style.height = "95px";
        img.style.objectFit = "cover";
        img.style.marginBottom = "5px";
        (img.style as any).userSelect = "none";
        (img.style as any).pointerEvents = "none";
      }

      item.querySelectorAll("span").forEach((p) => {
        const el = p as HTMLElement;
        el.style.fontSize = "0.75rem"; // text-xs
        el.style.lineHeight = "1.2";
        el.style.margin = "0";
        el.style.textAlign = "center";
        el.style.overflow = "visible";
        (el.style as any).textOverflow = "ellipsis";
        el.style.whiteSpace = "normal";
        (el.style as any).wordBreak = "break-word";
        el.style.maxHeight = "4em";
      });
    });

    // 2.5) Inject a temporary stylesheet to neutralize modern color functions within the clone scope
    const tempStyle = document.createElement("style");
    tempStyle.setAttribute("data-capture-style", "1");
    tempStyle.textContent = `
[data-capture-export] * { 
  background: none !important;
  background-image: none !important;
  text-shadow: none !important;
  box-shadow: none !important;
}
[data-capture-export], [data-capture-export] * {
  background-color: #ffffff !important;
  color: #111111 !important;
  border-color: #e5e7eb !important;
  outline-color: #e5e7eb !important;
}`;
    document.head.appendChild(tempStyle);

    // 3) Append the clone off-screen
    document.body.appendChild(cloneContainer);

    try {
      // 4) Capture the clone
      await (document as any).fonts?.ready;
      const canvas = await html2canvas(cloneContainer, {
        backgroundColor: "#ffffff",
        logging: true,
        useCORS: true,
        width: targetWidth,
        windowWidth: targetWidth,
        scrollX: 0,
        scrollY: 0,
        allowTaint: false,
        scale: 2,
        imageTimeout: 2000,
        onclone: (clonedDoc) => {
          const styleEl = clonedDoc.createElement('style');
          styleEl.textContent = `
[data-capture-export] * { 
  background: none !important;
  background-image: none !important;
  text-shadow: none !important;
  box-shadow: none !important;
}
[data-capture-export], [data-capture-export] * {
  background-color: #ffffff !important;
  color: #111111 !important;
  border-color: #e5e7eb !important;
  outline-color: #e5e7eb !important;
}`;
          clonedDoc.head.appendChild(styleEl);
          // Ensure clone document and body have safe background
          clonedDoc.documentElement.style.background = '#ffffff';
          clonedDoc.body.style.background = '#ffffff';
          // Extra defensive pass to clear any computed lab/oklch values
          const root = clonedDoc.querySelector('[data-capture-export="1"]') as HTMLElement | null;
          const win = clonedDoc.defaultView || window;
          const containsModern = (v: string | null) => !!v && (v.includes('lab(') || v.includes('oklch') || v.includes('color-mix(') || v.includes('color('));
          const scrub = (el: HTMLElement) => {
            const cs = win.getComputedStyle(el);
            if (containsModern(cs.background) || containsModern(cs.backgroundImage) || containsModern(cs.backgroundColor)) {
              el.style.setProperty('background', 'none', 'important');
              el.style.setProperty('background-image', 'none', 'important');
              el.style.setProperty('background-color', '#ffffff', 'important');
            }
            if (containsModern(cs.color)) {
              el.style.setProperty('color', '#111111', 'important');
            }
            if (containsModern(cs.borderColor)) {
              el.style.setProperty('border-color', '#e5e7eb', 'important');
            }
            if (containsModern(cs.outlineColor)) {
              el.style.setProperty('outline-color', '#e5e7eb', 'important');
            }
          };
          if (root) {
            scrub(root);
            root.querySelectorAll<HTMLElement>('*').forEach(scrub);
            // Restore tier label background colors with safe RGB/HEX values
            const labelColorMap: Record<string, string> = {
              S: '#e11d48', // rose-600
              A: '#d97706', // amber-600
              B: '#059669', // emerald-600
              C: '#0284c7', // sky-600
              D: '#7c3aed', // violet-600
              F: '#1f2937', // gray-800
            };
            root.querySelectorAll<HTMLElement>('[data-tier-label]').forEach((el) => {
              const key = el.getAttribute('data-tier-label') || '';
              const color = labelColorMap[key] || '#111111';
              el.style.setProperty('background', 'none', 'important');
              el.style.setProperty('background-image', 'none', 'important');
              el.style.setProperty('background-color', color, 'important');
              el.style.setProperty('color', '#ffffff', 'important');
            });
          }
        },
      });

      const link = document.createElement("a");
      link.download = "tier-list.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error generating canvas:", error);
      alert("عذراً، حدث خطأ أثناء حفظ الصورة.");
    } finally {
      // 5) Remove the clone
      if (document.body.contains(cloneContainer)) {
        document.body.removeChild(cloneContainer);
      }
      const injected = document.querySelector('style[data-capture-style="1"]');
      if (injected && injected.parentNode) {
        injected.parentNode.removeChild(injected);
      }
    }
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
        <Button type="button" onClick={submit} disabled={isSubmitting}>إرسال</Button>
        <Button type="button" variant="secondary" onClick={saveImage} disabled={isSubmitting}>حفظ كصورة</Button>
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



