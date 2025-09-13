"use client";
import { useEffect } from "react";

type TierKey = "S" | "A" | "B" | "C" | "D" | "F";

declare global {
  interface Window {
    jolaniList?: () => Promise<any>;
    submitJolani?: (tiers: Record<TierKey, string[]>, opts?: { deviceId?: string; date?: string }) => Promise<any>;
    j?: (tiers: Record<TierKey, string[]>, opts?: { deviceId?: string; date?: string }) => Promise<any>;
    jhelp?: () => void;
  }
}

export default function JolaniConsoleHook() {
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    async function jolaniList(): Promise<Array<{ id: string; name: string }>> {
      const res = await fetch(`${base}/api/jolani/candidates`, { cache: "no-store" });
      const data = await res.json();
      const list = (data?.candidates || []).map((c: any) => ({ id: c.id as string, name: c.name as string }));
      return list;
    }
    async function submitJolani(tiers: Record<TierKey, string[]>, opts?: { deviceId?: string; date?: string }) {
      const res = await fetch(`${base}/api/jolani/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tiers, deviceId: opts?.deviceId, date: opts?.date }),
      });
      return res.json();
    }
    async function j(tiers: Record<TierKey, string[]>, opts?: { deviceId?: string; date?: string }) {
      return submitJolani(tiers, opts);
    }
    function jhelp() {
      // eslint-disable-next-line no-console
      console.log(`Usage:\n\n- List candidates (id + name):\n  await jolaniList()\n\n- Submit by IDs (order matters):\n  await j({ S:["jolani1","jolani2"], A:[], B:[], C:[], D:[], F:[] })`);
    }
    window.jolaniList = jolaniList;
    window.submitJolani = submitJolani;
    window.j = j;
    window.jhelp = jhelp;

    // eslint-disable-next-line no-console
    console.log(`
00000000010101111000000000000000000000000000000110101111111110000011111110000000
00000000111111111000000101010000000001000110100111011111111110000011111110000000
00000001111111111000010000000000000000000000000111111111111111000011111110000000
00000001111111111000000000000000000000000000000001100011111111001011111110000000
00000000111111111011111110000000000000000000000000000000111111100011111100000000
00000000111111111100000000000000000000000000000000000001011111100011111100000000
00000000111111111100000000000000000000000000000111111111111111100111111100000000
00000000111111010000111111111111111111111111111111111111111111100011111000000000
00000011011110000011111111111111111111111111111111111111111111110000110000000000
00000111111110000111111111111111111111111111111111111111111111111000110000000000
00000111110110011111111111111111111111110001111111111111111111111110011110000000
00000001010100011111111111111111111111100000111111111111111111111110011100000000
00000001111100011111111111111111111111000000111111111111111111111110011000000000
00000001111100011111111111111111111110000001011111111111111111111110110000000000
00000001111110011100001111111111011100000000000111111111111111111110110000000000
00000100011111001100000011111100110000000000000011111111111111111100110000000000
00000111100111011111110011100001111000000000000011111111111111111101110000000000
00000111110111111111111000000001110000000000001111111111111111111111110000000000
00000111110111111111000000000111100000000000000111111000111111111111110000000000
00000111111111111110100000001111100000000011100011111111101111111111110000000000
00000111111111111100000011011111111111111111111111111111111011111111111111111111
   ▗▖ ▗▄▖ ▗▖    ▗▄▖ ▗▖  ▗▖▗▄▄▄▖        ▗▄▄▄▖▗▄▄▄▖▗▄▄▄▖▗▄▄▖ ▗▖   ▗▄▄▄▖ ▗▄▄▖▗▄▄▄▖
   ▐▌▐▌ ▐▌▐▌   ▐▌ ▐▌▐▛▚▖▐▌  █            █    █  ▐▌   ▐▌ ▐▌▐▌     █  ▐▌     █  
   ▐▌▐▌ ▐▌▐▌   ▐▛▀▜▌▐▌ ▝▜▌  █            █    █  ▐▛▀▀▘▐▛▀▚▖▐▌     █   ▝▀▚▖  █  
▗▄▄▞▘▝▚▄▞▘▐▙▄▄▖▐▌ ▐▌▐▌  ▐▌▗▄█▄▖          █  ▗▄█▄▖▐▙▄▄▖▐▌ ▐▌▐▙▄▄▖▗▄█▄▖▗▄▄▞▘  █                                                                                                                                                                                                       
`);
    // eslint-disable-next-line no-console
    console.log("Type jhelp() for usage. Example: j({ S:['jolani1','jolani2'] })");
    return () => {
      delete window.jolaniList;
      delete window.submitJolani;
      delete window.j;
      delete window.jhelp;
    };
  }, []);
  return null;
}


