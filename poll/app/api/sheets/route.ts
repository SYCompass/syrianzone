import { NextResponse } from "next/server";

function parseCsv(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === ',') {
          result.push(current);
          current = "";
        } else if (ch === '"') {
          inQuotes = true;
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result.map((v) => v.trim());
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const values = parseLine(l);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    return row;
  });

  return { headers, rows };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key") || "default";
    const id = url.searchParams.get("id");
    const gid = url.searchParams.get("gid");
    const sheetUrl = url.searchParams.get("url");

    const allowed: Record<string, string | undefined> = {
      default: process.env.SHEETS_DEFAULT_CSV_URL,
    };

    let csvUrl = allowed[key];
    if (id && gid) {
      csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    } else if (sheetUrl) {
      try {
        const u = new URL(sheetUrl);
        const parts = u.pathname.split('/');
        const maybeId = parts.includes('d') ? parts[parts.indexOf('d') + 1] : undefined;
        const maybeGid = u.searchParams.get('gid') || /[?&#]gid=(\d+)/.exec(sheetUrl)?.[1] || undefined;
        if (maybeId && maybeGid) {
          csvUrl = `https://docs.google.com/spreadsheets/d/${maybeId}/export?format=csv&gid=${maybeGid}`;
        }
      } catch {}
    }
    if (!csvUrl) {
      return NextResponse.json({ error: "Unknown sheet key or URL not configured" }, { status: 400 });
    }

    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const text = await res.text();
    const parsed = parseCsv(text);
    return NextResponse.json(parsed, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}


