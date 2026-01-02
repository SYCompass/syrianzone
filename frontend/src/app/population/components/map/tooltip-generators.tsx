import { getCanonicalCityName } from '@/lib/city-name-standardizer';

export function generateRainChartHtml(name: string, data: any[]) {
    const displayName = getCanonicalCityName(name);
    const sorted = [...data].sort((a, b) => a.year - b.year);
    const maxVal = Math.max(...sorted.map(d => d.rainfall));

    const barsHtml = sorted.map(d => {
        const height = maxVal > 0 ? (d.rainfall / maxVal) * 40 : 0;
        const isCurrentYear = d.year === 2025;
        const barColor = isCurrentYear ? '#38bdf8' : '#64748b';

        return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                <div style="
                    height: ${Math.max(height, 4)}px; 
                    width: 6px; 
                    background-color: ${barColor}; 
                    border-radius: 1px;
                " title="${d.year}: ${d.rainfall}mm"></div>
                <div style="font-size: 8px; color: #94a3b8; transform: rotate(-45deg); margin-top: 2px;">${d.year.toString().slice(2)}</div>
            </div>
        `;
    }).join('');

    const latest = sorted[sorted.length - 1];

    return `
        <div class="text-right" style="font-family: 'IBM Plex Sans Arabic', sans-serif; min-width: 130px;">
            <div class="font-bold text-base mb-1 text-slate-100">${displayName}</div>
            <div class="flex justify-between items-end mb-2 mt-2">
                <div>
                    <div class="text-[10px] text-slate-400">آخر هطول</div>
                    <div class="font-mono text-sm text-cyan-400 font-bold" style="direction: ltr">${latest.rainfall} <span class="text-[9px]">mm</span></div>
                </div>
                <div style="display: flex; align-items: flex-end; gap: 3px; height: 50px; padding-bottom: 5px; margin-right: 10px;">
                    ${barsHtml}
                </div>
            </div>
        </div>
    `;
}

export function generatePopulationTooltipHtml(name: string, value: number, label: string) {
    const displayName = getCanonicalCityName(name);
    const valueStr = value ? value.toLocaleString('en-US') : 'لا توجد بيانات';
    
    return `
        <div class="text-right" style="font-family: 'IBM Plex Sans Arabic', sans-serif;">
            <div class="font-bold text-base mb-1">${displayName}</div>
            <div class="text-sm">${label}: ${valueStr}</div>
        </div>
    `;
}