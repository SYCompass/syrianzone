"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PopulationGroups, DataType, DATA_TYPES, DATA_TYPE_CONFIG, RainfallData } from './types';
import { Layers, Info, Filter, X, BarChart3, CheckSquare, Square, ExternalLink, CloudRain } from 'lucide-react';
import { getGovernorateNameAr } from '@/lib/geo-utils';
import rainfallJson from './rainfall_yearly.json';

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
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    
    // Comparison tool state
    const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);

    // Cast the imported JSON
    const rainfallData = rainfallJson as RainfallData;

    useEffect(() => {
        fetch('/assets/population/syria_provinces.geojson')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error('Failed to load GeoJSON', err));
    }, []);

    useEffect(() => {
        if (currentDataType === DATA_TYPES.RAINFALL) {
            // Rainfall doesn't use the standard source_id logic, set a dummy one to trigger updates
            setCurrentSourceId(999);
        } else {
            const sources = initialData[currentDataType];
            if (sources && sources.length > 0) {
                setCurrentSourceId(sources[0].source_id);
            } else {
                setCurrentSourceId(null);
            }
        }
    }, [currentDataType, initialData]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsPanelOpen(true);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentSource = useMemo(() => {
        if (currentDataType === DATA_TYPES.RAINFALL) return null;
        return initialData[currentDataType].find(s => s.source_id === currentSourceId);
    }, [initialData, currentDataType, currentSourceId]);

    const populationData = currentSource ? currentSource.cities : null;
    const config = DATA_TYPE_CONFIG[currentDataType];

    const dynamicThresholds = useMemo(() => {
        if (currentDataType === DATA_TYPES.RAINFALL) return config.thresholds;
        if (!populationData) return config.thresholds;
        
        const values = Object.values(populationData).filter(v => v > 0);
        if (values.length === 0) return config.thresholds;
        
        const max = Math.max(...values);
        return [Math.floor(max * 0.1), Math.floor(max * 0.4), Math.floor(max * 0.7)];
    }, [populationData, config.thresholds, currentDataType]);

    const toggleProvinceSelection = (province: string) => {
        setSelectedProvinces(prev => {
            if (prev.includes(province)) return prev.filter(p => p !== province);
            if (prev.length < 2) return [...prev, province];
            return [prev[1], province]; 
        });
    };

    // Helper for comparison data (only relevant for population types)
    const getProvinceStats = (provinceName: string) => {
        const stats: any = {};
        Object.values(DATA_TYPES).forEach(type => {
            if (type === DATA_TYPES.RAINFALL) return;
            
            // Use current source if type matches current selection, otherwise default to first source
            let source;
            if (type === currentDataType && currentSource) {
                source = currentSource;
            } else {
                source = initialData[type][0];
            }
            if (source) {
                const nameAr = getGovernorateNameAr(provinceName);
                stats[type] = source.cities[provinceName] ?? source.cities[nameAr] ?? 0;
            } else {
                stats[type] = 0;
            }
        });
        return stats;
    };

    const comparisonData = useMemo(() => {
        if (selectedProvinces.length !== 2) return null;
        return {
            p1: { name: getGovernorateNameAr(selectedProvinces[0]), stats: getProvinceStats(selectedProvinces[0]) },
            p2: { name: getGovernorateNameAr(selectedProvinces[1]), stats: getProvinceStats(selectedProvinces[1]) }
        };
    }, [selectedProvinces, initialData, currentDataType, currentSource]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden relative bg-background text-foreground" dir="rtl">
            
            {/* Comparison Pop-up (Only show if data exists and not in Rain mode) */}
            {comparisonData && currentDataType !== DATA_TYPES.RAINFALL && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] w-[90%] max-w-2xl bg-card border-2 border-primary rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center p-4 border-b border-border">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <BarChart3 className="text-primary" size={20} />
                            مقارنة المحافظات
                        </h3>
                        <button onClick={() => setSelectedProvinces([])} className="p-1 hover:bg-muted rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="text-center font-bold text-lg text-primary truncate">{comparisonData.p1.name}</div>
                            <div className="text-center text-muted-foreground text-sm self-center">مقابل</div>
                            <div className="text-center font-bold text-lg text-primary truncate">{comparisonData.p2.name}</div>
                        </div>

                        <div className="space-y-8">
                            {Object.values(DATA_TYPES).filter(t => t !== DATA_TYPES.RAINFALL).map(type => {
                                const v1 = comparisonData.p1.stats[type];
                                const v2 = comparisonData.p2.stats[type];
                                const max = Math.max(v1, v2, 1);
                                const label = DATA_TYPE_CONFIG[type].labelAr;

                                return (
                                    <div key={type} className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium mb-1 px-1">
                                            <span>{v1.toLocaleString()}</span>
                                            <span className="text-muted-foreground">{label}</span>
                                            <span>{v2.toLocaleString()}</span>
                                        </div>
                                        <div className="flex h-4 w-full gap-1 bg-muted rounded-full overflow-hidden">
                                            <div className="flex justify-end w-1/2">
                                                <div 
                                                    className="h-full bg-primary transition-all duration-500 rounded-r-full" 
                                                    style={{ width: `${(v1 / max) * 100}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-start w-1/2">
                                                <div 
                                                    className="h-full bg-primary/60 transition-all duration-500 rounded-l-full" 
                                                    style={{ width: `${(v2 / max) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-8 pt-4 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>* تعتمد المقارنة على أحدث المصادر المتوفرة لكل فئة.</span>
                            <button onClick={() => setSelectedProvinces([])} className="text-primary hover:underline font-medium">إغلاق المقارنة</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Overlay */}
            <div className="absolute top-4 right-4 z-[400] pointer-events-none">
                <div className="bg-card/90 backdrop-blur p-4 rounded-lg shadow-lg border border-border pointer-events-auto max-w-sm">
                    <h1 className="text-xl font-bold text-foreground mb-1">أطلس سوريا</h1>
                    <p className="text-sm text-muted-foreground">
                        {currentDataType === DATA_TYPES.RAINFALL 
                            ? 'عرض بيانات الهطولات المطرية السنوية (2021-2025)' 
                            : 'خريطة تفاعلية للبيانات السكانية والإنسانية'}
                    </p>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-grow relative z-0">
                <MapClient
                    geoJsonData={geoJsonData}
                    populationData={populationData}
                    rainfallData={rainfallData}
                    currentDataType={currentDataType}
                    currentSourceId={currentSourceId}
                    customThresholds={dynamicThresholds}
                />
                
                {/* Legend Overlay */}
                <div className="absolute bottom-6 right-6 z-[400] bg-card/90 backdrop-blur p-3 rounded shadow-lg border border-border text-sm min-w-[150px]">
                    <h4 className="font-bold mb-2 text-foreground flex items-center gap-2">
                        {currentDataType === DATA_TYPES.RAINFALL && <CloudRain size={16} className="text-primary"/>}
                        {config.labelAr}
                    </h4>
                    <div className="space-y-1.5">
                        {config.legend.map((item, idx) => (
                             <div key={idx} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="text-muted-foreground text-xs">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Side Panel */}
            <div className={`absolute top-0 left-0 bottom-0 z-[500] w-80 bg-card border-r border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="absolute -right-12 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-card text-primary rounded-r-lg shadow-md flex items-center justify-center hover:bg-accent border-y border-r border-border">
                    <Filter size={20} />
                </button>

                <div className="p-4 border-b border-border bg-card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Layers size={18} /> البيانات</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-1">
                        {Object.values(DATA_TYPES).map(type => (
                            <button
                                key={type}
                                onClick={() => {
                                    setCurrentDataType(type);
                                    if (type === DATA_TYPES.RAINFALL) setSelectedProvinces([]); // Clear comparisons
                                }}
                                className={`py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 border
                                    ${currentDataType === type 
                                        ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
                                        : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'}`}
                            >
                                {type === DATA_TYPES.RAINFALL && <CloudRain size={14} />}
                                {DATA_TYPE_CONFIG[type].labelAr}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card">
                    
                    {/* OPTION 1: RAINFALL PANEL CONTENT */}
                    {currentDataType === DATA_TYPES.RAINFALL ? (
                        <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground py-10 px-4">
                            <CloudRain className="opacity-50 mb-4" size={48} />
                            <h3 className="font-bold text-foreground mb-2">خريطة الأمطار</h3>
                            <p className="text-sm leading-relaxed mb-6">
                                حرك المؤشر فوق المناطق في الخريطة لعرض المخططات البيانية السنوية للهطولات المطرية.
                            </p>
                            
                            <div className="w-full text-xs text-right bg-muted/50 p-3 rounded border border-border">
                                <span className="font-bold block mb-1 text-foreground">عن البيانات:</span>
                                تغطي البيانات الفترة من 2021 إلى 2025، وتظهر معدلات الهطول بالملم. يمثل اللون الأزرق السماوي في المخطط عام 2025.
                            </div>
                        </div>
                    ) : (
                        /* OPTION 2: POPULATION PANEL CONTENT (New Upstream Layout) */
                        initialData[currentDataType]?.map(source => {
                            const isExpanded = currentSourceId === source.source_id;

                            return (
                                <div key={source.source_id} className={`rounded-lg border transition-all duration-200 ${isExpanded ? 'border-primary bg-card shadow-md' : 'border-border bg-card/50 hover:bg-muted/50'}`}>

                                    {/* Accordion Header */}
                                    <div
                                        className="p-3 flex flex-col gap-3 cursor-pointer select-none"
                                        onClick={() => setCurrentSourceId(source.source_id)}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-sm">
                                                {source.note || DATA_TYPE_CONFIG[currentDataType].labelAr}
                                            </span>
                                            {source.date && (
                                                <span className="text-xs text-muted-foreground">{source.date}</span>
                                            )}
                                        </div>

                                        {source.source_url && (
                                            <div className="flex">
                                                <a
                                                    href={source.source_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:text-primary/80 flex items-center gap-1 text-[10px] bg-primary/10 px-2 py-1 rounded-full transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    رابط المصدر الأصلي
                                                    <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Accordion Body (Table) */}
                                    {isExpanded && (
                                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
                                            <div className="mb-2 flex justify-between items-center px-1">
                                                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">قائمة المحافظات</h3>
                                                {selectedProvinces.length > 0 && (
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                                        تم اختيار {selectedProvinces.length}/2
                                                    </span>
                                                )}
                                            </div>

                                            <div className="overflow-hidden rounded-md border border-border/50">
                                                <table className="w-full text-xs text-right">
                                                    <thead className="bg-muted/50 text-muted-foreground">
                                                        <tr>
                                                            <th className="py-2 px-2 text-center w-8"></th>
                                                            <th className="py-2 px-2 font-medium">المحافظة</th>
                                                            <th className="py-2 px-2 text-left font-medium">العدد</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/50 bg-card">
                                                        {Object.entries(source.cities)
                                                            .sort(([, a], [, b]) => b - a)
                                                            .map(([city, pop]) => {
                                                                const isSelected = selectedProvinces.includes(city);
                                                                const nameAr = getGovernorateNameAr(city);
                                                                return (
                                                                    <tr
                                                                        key={city}
                                                                        className={`hover:bg-muted/50 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                                                                        onClick={() => toggleProvinceSelection(city)}
                                                                    >
                                                                        <td className="py-1.5 px-2 text-center">
                                                                            <div className="flex justify-center">
                                                                                {isSelected ?
                                                                                    <CheckSquare size={14} className="text-primary fill-primary/10" /> :
                                                                                    <Square size={14} className="text-muted-foreground" />
                                                                                }
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-1.5 px-2 font-medium">{nameAr}</td>
                                                                        <td className="py-1.5 px-2 text-left font-mono text-muted-foreground">
                                                                            {pop.toLocaleString('en-US')}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {currentDataType !== DATA_TYPES.RAINFALL && (
                    <div className="p-4 bg-muted border-t border-border text-xs text-muted-foreground">
                        <p className="flex items-center gap-1 mb-1">
                            <Info size={14} /> اختر محافظتين للمقارنة بينهما
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}