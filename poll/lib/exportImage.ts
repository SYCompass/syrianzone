import html2canvas from "html2canvas";

type ExportOptions = {
  container: HTMLElement;
  targetWidthPx?: number;
  basePath?: string;
  logoSrc?: string;
  watermarkText?: string;
  fileName?: string;
  scale?: number;
};

export async function exportTierListImage(options: ExportOptions): Promise<void> {
  const {
    container,
    targetWidthPx = 1000,
    basePath = "",
    logoSrc = 
      (typeof window !== "undefined" ? `${basePath}/assets/logo-lightmode.svg` : "/assets/logo-lightmode.svg"),
    watermarkText = "syrian.zone/tierlist",
    fileName = "tier-list.png",
    scale = 2,
  } = options;

  const cloneContainer = container.cloneNode(true) as HTMLElement;
  cloneContainer.setAttribute("data-capture-export", "1");

  const srcPadding = window.getComputedStyle(container).padding;
  cloneContainer.style.position = "absolute";
  cloneContainer.style.left = "-9999px";
  cloneContainer.style.top = "0px";
  cloneContainer.style.width = `${targetWidthPx}px`;
  cloneContainer.style.height = "auto";
  cloneContainer.style.display = "block";
  cloneContainer.style.backgroundColor = "#ffffff";
  cloneContainer.style.padding = srcPadding;
  cloneContainer.style.boxShadow = "none";

  cloneContainer.querySelectorAll<HTMLElement>("[data-tier-area]").forEach((zone) => {
    zone.style.border = "1px solid #eee";
    zone.style.backgroundColor = "#fdfdfd";
    zone.style.borderStyle = "solid";
  });

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
      el.style.fontSize = "0.75rem";
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

  const wmFontSize = Math.max(32, Math.floor(targetWidthPx * 0.018));
  const footer = document.createElement("div");
  footer.setAttribute("data-capture-watermark", "1");
  footer.style.position = "absolute";
  footer.style.left = "0";
  footer.style.right = "0";
  footer.style.bottom = "0";
  footer.style.width = "100%";
  footer.style.zIndex = "2147483647";
  footer.style.pointerEvents = "none";
  footer.style.padding = "8px 12px";
  footer.style.display = "flex";
  footer.style.flexDirection = "row";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "center";
  footer.style.gap = "12px";
  footer.style.fontWeight = "600";
  footer.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  footer.style.fontSize = `${wmFontSize}px`;

  const textEl = document.createElement("div");
  textEl.textContent = watermarkText;
  footer.style.setProperty("color", "#111111", "important");

  let appended = false;
  try {
    const res = await fetch(logoSrc, { cache: "force-cache" });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && (contentType.includes("image/svg") || logoSrc.endsWith(".svg"))) {
      const svgText = await res.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgEl = svgDoc.documentElement as unknown as SVGElement;
      const styleEl = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
      styleEl.textContent = "*{fill:#111111 !important; stroke:#111111 !important;}";
      svgEl.insertBefore(styleEl, svgEl.firstChild);
      (svgEl as unknown as HTMLElement).style.width = `${Math.max(150, Math.floor(wmFontSize * 1.25))}px`;
      (svgEl as unknown as HTMLElement).style.height = "auto";
      (svgEl as unknown as HTMLElement).style.display = "block";
      const imported = document.importNode(svgEl, true);
      footer.appendChild(textEl);
      footer.appendChild(imported as unknown as Node);
      appended = true;
    }
  } catch {}

  if (!appended) {
    let resolvedLogoSrc = logoSrc;
    try {
      if (!logoSrc.startsWith("data:")) {
        const res = await fetch(logoSrc, { cache: "force-cache" });
        if (res.ok) {
          const blob = await res.blob();
          resolvedLogoSrc = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch {}

    const logoImg = document.createElement("img");
    logoImg.crossOrigin = "anonymous";
    (logoImg as any).referrerPolicy = "no-referrer";
    (logoImg as any).decoding = "sync";
    (logoImg as any).loading = "eager";
    logoImg.src = resolvedLogoSrc;
    logoImg.alt = "Logo";
    logoImg.style.width = `${Math.max(150, Math.floor(wmFontSize * 1.25))}px`;
    logoImg.style.height = "auto";
    logoImg.style.display = "block";
    footer.appendChild(textEl);
    footer.appendChild(logoImg);
  }
  cloneContainer.appendChild(footer);

  try {
    try {
      if (typeof (logoImg as any).decode === "function") {
        await (logoImg as any).decode();
      } else {
        await new Promise((resolve) => {
          logoImg.onload = () => resolve(null);
          logoImg.onerror = () => resolve(null);
        });
      }
    } catch {}
    const computed = window.getComputedStyle(cloneContainer);
    const currentPadBottom = parseInt(computed.paddingBottom, 10) || 0;
    const footerHeight = Math.ceil(footer.getBoundingClientRect().height) || Math.ceil(wmFontSize * 1.8);
    cloneContainer.style.paddingBottom = `${currentPadBottom + footerHeight}px`;
  } catch {}

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
  document.body.appendChild(cloneContainer);

  try {
    await (document as any).fonts?.ready;
    const canvas = await html2canvas(cloneContainer, {
      backgroundColor: "#ffffff",
      logging: true,
      useCORS: true,
      width: targetWidthPx,
      windowWidth: targetWidthPx,
      scrollX: 0,
      scrollY: 0,
      allowTaint: false,
      scale,
      imageTimeout: 15000,
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
        clonedDoc.documentElement.style.background = '#ffffff';
        clonedDoc.body.style.background = '#ffffff';
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
          const labelColorMap: Record<string, string> = {
            S: '#e11d48',
            A: '#d97706',
            B: '#059669',
            C: '#0284c7',
            D: '#7c3aed',
            F: '#1f2937',
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
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    if (document.body.contains(cloneContainer)) {
      document.body.removeChild(cloneContainer);
    }
    const injected = document.querySelector('style[data-capture-style="1"]');
    if (injected && injected.parentNode) {
      injected.parentNode.removeChild(injected);
    }
  }
}


