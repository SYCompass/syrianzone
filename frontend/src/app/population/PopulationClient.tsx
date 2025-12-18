"use client";

import React, { useState, useEffect } from 'react';
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
            // Check if we can keep current source (if it exists in new type - unlikely but logic wise)
            // Or just pick first
            setCurrentSourceId(sources[0].source_id);
        } else {
            setCurrentSourceId(null);
        }
    }, [currentDataType, initialData]);

    const currentSource = initialData[currentDataType].find(s => s.source_id === currentSourceId);
    const populationData = currentSource ? currentSource.cities : null;
    const config = DATA_TYPE_CONFIG[currentDataType];

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
                />

                {/* Legend Overlay */}
                <div className="absolute bottom-6 right-6 z-[400] bg-card/90 backdrop-blur p-3 rounded shadow-lg border border-border text-sm">
                    <h4 className="font-bold mb-2 text-foreground">{config.labelAr}</h4>
                    <div className="space-y-1">
                        {config.legend.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="text-muted-foreground text-xs">{item.label}</span>
                            </div>
                        ))}
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
                            <button
                                key={source.source_id}
                                onClick={() => setCurrentSourceId(source.source_id)}
                                className={`
                                    w-full text-right p-3 rounded-lg border text-sm transition-all
                                    ${currentSourceId === source.source_id
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary'
                                        : 'border-border hover:border-accent bg-card shadow-sm'}
                                `}
                            >
                                <div className="font-semibold text-foreground mb-1">
                                    {source.note || 'مصدر غير مسمى'} ({source.date})
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span>المصدر: {source.source_id}</span>
                                    <span>{Object.keys(source.cities).length} محافظة</span>
                                </div>
                            </button>
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
