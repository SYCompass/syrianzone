"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PopulationGroups, DataType, DATA_TYPES, DATA_TYPE_CONFIG, CityData, DataSource } from './types';
import { Layers, Info, Filter } from 'lucide-react';

// Dynamic import for Map to avoid SSR issues with Leaflet
const MapClient = dynamic(() => import('./MapClient'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-card text-muted-foreground">جاري تحميل الخريطة...</div>
});

interface PopulationClientProps {
    initialData: PopulationGroups;
}

export default function PopulationClient({ initialData }: PopulationClientProps) {
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [currentDataType, setCurrentDataType] = useState<DataType>(DATA_TYPES.POPULATION);
    const [currentSourceId, setCurrentSourceId] = useState<number | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    // Load GeoJSON on mount
    useEffect(() => {
        fetch('/assets/population/syria_provinces.geojson')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error('Failed to load GeoJSON', err));
    }, []);

    // Select first source when data type changes
    useEffect(() => {
        const sources = initialData[currentDataType];
        if (sources && sources.length > 0) {
            setCurrentSourceId(sources[0].source_id);
        } else {
            setCurrentSourceId(null);
        }
    }, [currentDataType, initialData]);

    const currentSource = useMemo(() =>
        initialData[currentDataType].find(s => s.source_id === currentSourceId),
        [initialData, currentDataType, currentSourceId]
    );

    const populationData = currentSource ? currentSource.cities : null;
    const config = DATA_TYPE_CONFIG[currentDataType];

    // Dynamic Thresholds Calculation
    const dynamicThresholds = useMemo(() => {
        if (!populationData) return config.thresholds;
        const values = Object.values(populationData).filter(v => v > 0);
        if (values.length === 0) return config.thresholds;
        const max = Math.max(...values);
        // Use 10%, 40%, 70% of max as dynamic thresholds for visualization
        return [
            Math.floor(max * 0.1),
            Math.floor(max * 0.4),
            Math.floor(max * 0.7)
        ];
    }, [populationData, config.thresholds]);

    // Format numbers for legend
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    };

    // Mobile Panel Toggle
    const togglePanel = () => setIsPanelOpen(!isPanelOpen);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden relative bg-background text-foreground" dir="rtl">
            {/* Header / Title Overlay */}
            <div className="absolute top-4 right-4 z-[400] pointer-events-none">
                <div className="bg-card/90 backdrop-blur p-4 rounded-lg shadow-lg border border-border pointer-events-auto max-w-sm">
                    <h1 className="text-xl font-bold text-foreground mb-1">أطلس سكان سوريا</h1>
                    <p className="text-sm text-muted-foreground">خريطة تفاعلية لعدد السكان حسب المحافظات</p>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-grow relative z-0">
                <MapClient
                    geoJsonData={geoJsonData}
                    populationData={populationData}
                    currentDataType={currentDataType}
                    currentSourceId={currentSourceId}
                    customThresholds={dynamicThresholds}
                />

                {/* Legend Overlay */}
                <div className="absolute bottom-6 right-6 z-[400] bg-card/90 backdrop-blur p-3 rounded shadow-lg border border-border text-sm min-w-[150px]">
                    <h4 className="font-bold mb-2 text-foreground">{config.labelAr}</h4>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.colors.none }}></span>
                            <span className="text-muted-foreground text-xs">لا توجد بيانات</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.colors.low }}></span>
                            <span className="text-muted-foreground text-xs">أقل من {formatNumber(dynamicThresholds[1])}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.colors.medium }}></span>
                            <span className="text-muted-foreground text-xs">{formatNumber(dynamicThresholds[1])} – {formatNumber(dynamicThresholds[2])}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.colors.high }}></span>
                            <span className="text-muted-foreground text-xs">أكثر من {formatNumber(dynamicThresholds[2])}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side Panel (Control Panel) */}
            <div
                className={`
                    absolute top-0 left-0 bottom-0 z-[500] 
                    w-80 bg-card border-r border-border shadow-2xl 
                    transform transition-transform duration-300 ease-in-out flex flex-col
                    ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Panel Toggle Handle (Visible when closed) */}
                <button
                    onClick={togglePanel}
                    className={`
                        absolute -right-12 top-1/2 transform -translate-y-1/2 
                        w-12 h-12 bg-card text-primary 
                        rounded-r-lg shadow-md flex items-center justify-center 
                        hover:bg-accent transition-colors
                        border-y border-r border-border
                    `}
                    aria-label="Toggle Panel"
                >
                    <Filter size={20} />
                </button>

                {/* Panel Header */}
                <div className="p-4 border-b border-border bg-card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Layers size={18} />
                            البيانات
                        </h2>
                        <button onClick={togglePanel} className="md:hidden text-muted-foreground hover:text-foreground">
                            <Filter size={18} />
                        </button>
                    </div>

                    {/* Data Type Tabs */}
                    <div className="flex rounded-lg bg-muted p-1">
                        {Object.values(DATA_TYPES).map(type => (
                            <button
                                key={type}
                                onClick={() => setCurrentDataType(type)}
                                className={`
                                    flex-1 py-1.5 text-sm font-medium rounded-md transition-all
                                    ${currentDataType === type
                                        ? 'bg-card text-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'}
                                `}
                            >
                                {DATA_TYPE_CONFIG[type].labelAr}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sources List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        المصادر المتاحة
                    </h3>

                    {initialData[currentDataType].length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            لا توجد مصادر لهذه الفئة حالياً
                        </div>
                    ) : (
                        initialData[currentDataType].map(source => (
                            <div
                                key={source.source_id}
                                className={`
                                    w-full rounded-lg border text-sm transition-all overflow-hidden
                                    ${currentSourceId === source.source_id
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary'
                                        : 'border-border hover:border-accent bg-card shadow-sm'}
                                `}
                            >
                                <button
                                    onClick={() => setCurrentSourceId(source.source_id)}
                                    className="w-full text-right p-3"
                                >
                                    <div className="font-semibold text-foreground mb-1">
                                        {source.note || 'مصدر غير مسمى'} ({source.date})
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <span>المصدر: {source.source_id}</span>
                                        <span>{Object.keys(source.cities).length} محافظة</span>
                                    </div>
                                </button>

                                {currentSourceId === source.source_id && (
                                    <div className="p-3 border-t border-primary/20 bg-background/50 animate-in slide-in-from-top-2 duration-200">
                                        <div className="mb-3">
                                            <a
                                                href={source.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary underline hover:text-primary/80 flex items-center gap-1"
                                            >
                                                رابط المصدر الأصلي
                                                <span className="text-[10px] transform rotate-45">↗</span>
                                            </a>
                                        </div>

                                        <div className="overflow-hidden rounded border border-border bg-card">
                                            <table className="w-full text-xs text-right">
                                                <thead className="bg-muted text-muted-foreground">
                                                    <tr>
                                                        <th className="py-2 px-3 font-medium">المحافظة</th>
                                                        <th className="py-2 px-3 text-left font-medium">العدد</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {Object.entries(source.cities)
                                                        .sort(([, a], [, b]) => b - a)
                                                        .map(([city, pop]) => (
                                                            <tr key={city} className="hover:bg-muted/50 transition-colors">
                                                                <td className="py-1.5 px-3 font-medium">{city}</td>
                                                                <td className="py-1.5 px-3 text-left font-mono text-muted-foreground">
                                                                    {pop.toLocaleString('en-US')}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                                <tfoot className="bg-muted/50 border-t border-border font-bold">
                                                    <tr>
                                                        <td className="py-2 px-3">الإجمالي</td>
                                                        <td className="py-2 px-3 text-left font-mono text-primary">
                                                            {Object.values(source.cities).reduce((sum, val) => sum + val, 0).toLocaleString('en-US')}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* About Panel Footer */}
                <div className="p-4 bg-muted border-t border-border text-xs text-muted-foreground">
                    <p className="flex items-center gap-1 mb-2">
                        <Info size={14} />
                        انقر على المحافظة لإظهار التفاصيل
                    </p>
                    <p>
                        المصدر: بيانات مجمعة من مصادر متعددة (UN, WorldPop, etc.)
                    </p>
                </div>
            </div>
        </div>
    );
}
