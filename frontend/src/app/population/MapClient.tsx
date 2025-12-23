"use client";

import React, { useEffect } from 'react';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DataType, DATA_TYPE_CONFIG, CityData, DATA_TYPES, RainfallData } from './types';
import { getGovernorateNameAr } from '@/lib/geo-utils';

// Fix for Leaflet icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapClientProps {
    geoJsonData: any;
    populationData: CityData | null;
    rainfallData?: RainfallData;
    currentDataType: DataType;
    currentSourceId: number | null;
    customThresholds: number[];
    onFeatureClick?: (feature: any) => void;
}

function normalizeCityName(name: string): string {
    if (!name) return '';
    return name.trim().replace(/['`]/g, '').replace(/Ḥ/g, 'H').toLowerCase();
}

// === BRIDGE: Mapping GeoJSON Names to Rainfall JSON Codes ===
const PROVINCE_TO_PCODE: { [key: string]: string } = {
    // English Normalizations
    'damascus': 'SY01',
    'aleppo': 'SY02',
    'rural damascus': 'SY03',
    'rif dimashq': 'SY03',
    'homs': 'SY04',
    'hama': 'SY05',
    'lattakia': 'SY06',
    'latakia': 'SY06',
    'idlib': 'SY07',
    'idleb': 'SY07',
    'al hasakah': 'SY08',
    'hasakah': 'SY08',
    'deir ez-zor': 'SY09',
    'deir ezzor': 'SY09',
    'tartous': 'SY10',
    'tartus': 'SY10',
    'ar raqqah': 'SY11',
    'raqqa': 'SY11',
    'daraa': 'SY12',
    'dar\'a': 'SY12',
    'as suwayda': 'SY13',
    'as suwayda\'': 'SY13',
    'sweida': 'SY13',
    'quneitra': 'SY14',
    'al qunaytirah': 'SY14',

    // Arabic Normalizations (Just in case GeoJSON uses Arabic)
    'دمشق': 'SY01',
    'حلب': 'SY02',
    'ريف دمشق': 'SY03',
    'حمص': 'SY04',
    'حماة': 'SY05',
    'اللاذقية': 'SY06',
    'إدلب': 'SY07',
    'الحسكة': 'SY08',
    'دير الزور': 'SY09',
    'طرطوس': 'SY10',
    'الرقة': 'SY11',
    'درعا': 'SY12',
    'السويداء': 'SY13',
    'القنيطرة': 'SY14'
};

function findPopulation(provinceName: string, populationData: CityData | null): number {
    if (!populationData) return 0;

    // 1. Try direct match with GeoJSON name (English from GeoJSON)
    if (populationData[provinceName]) return populationData[provinceName];

    // 2. Try match with translated Arabic name (Support for Arabic CSV)
    const nameAr = getGovernorateNameAr(provinceName);
    if (populationData[nameAr]) return populationData[nameAr];

    // 3. Normalized fallback for variations
    const normalized = normalizeCityName(provinceName);
    const mapping = Object.keys(populationData).reduce((acc: any, city) => {
        acc[normalizeCityName(city)] = city;
        return acc;
    }, {});

    if (mapping[normalized]) return populationData[mapping[normalized]];

    const special: { [key: string]: string[] } = {
        'Al Ḥasakah': ['Al Hasakah', 'Hasakah'],
        'Ar Raqqah': ['Raqqa'],
        "As Suwayda'": ['As Suwayda'],
        "Dar`a": ['Daraa'],
        'Dayr Az Zawr': ['Deir ez-Zor'],
        'Rif Dimashq': ['Rural Damascus'],
        'Ḥimş': ['Homs'],
        'Ḩamāh': ['Hama'],
        'Idlib': ['Idleb'],
        'Ţarţūs': ['Tartous']
    };

    if (special[provinceName]) {
        for (const v of special[provinceName]) {
            if (populationData[v]) return populationData[v];
        }
    }
    return 0;
}

// === IMPROVED DATA FINDER ===
function findRainData(feature: any, rainData: RainfallData | undefined) {
    if (!rainData) return null;

    const props = feature.properties;

    // 1. Try Direct P-Code Match (if GeoJSON has codes)
    const codeKeys = ['ADM1_PCODE', 'ADM2_PCODE', 'admin1Pcode', 'admin2Pcode', 'code', 'id', 'PCODE'];
    for (const key of codeKeys) {
        if (props[key] && rainData[props[key]]) {
            return rainData[props[key]];
        }
    }

    // 2. Try Name Match (Fallback)
    const nameKeys = ['province_name', 'ADM1_EN', 'ADM1_AR', 'name', 'Name', 'NAME', 'admin1Name_en'];
    for (const key of nameKeys) {
        if (props[key]) {
            const rawName = props[key];
            const normalized = normalizeCityName(rawName);

            // Check dictionary mapping
            const mappedCode = PROVINCE_TO_PCODE[normalized];
            if (mappedCode && rainData[mappedCode]) {
                return rainData[mappedCode];
            }
        }
    }

    return null;
}

function getColor(value: number, dataType: DataType, thresholds: number[]): string {
    const config = DATA_TYPE_CONFIG[dataType];
    if (!config) return '#2a3033';

    if (value === 0) return config.colors.none;
    if (value > thresholds[2]) return config.colors.high;
    if (value > thresholds[1]) return config.colors.medium;
    if (value > thresholds[0]) return config.colors.low;
    return config.colors.low;
}

function generateRainChartHtml(name: string, data: any[]) {
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
            <div class="font-bold text-base mb-1 text-slate-100">${name}</div>
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

function MapUpdater({ geoJsonData }: { geoJsonData: any }) {
    const map = useMap();

    useEffect(() => {
        if (geoJsonData) {
            const layer = L.geoJSON(geoJsonData);
            if (layer.getLayers().length > 0) {
                map.fitBounds(layer.getBounds(), { padding: [20, 20] });
            }
        }
    }, [geoJsonData, map]);

    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [map]);

    return null;
}

export default function MapClient({ geoJsonData, populationData, rainfallData, currentDataType, currentSourceId, customThresholds, onFeatureClick }: MapClientProps) {

    const style = (feature: any) => {
        let value = 0;

        if (currentDataType === DATA_TYPES.RAINFALL) {
            const rData = findRainData(feature, rainfallData);
            if (rData && rData.length > 0) {
                const target = rData.find((x: any) => x.year === 2024) || rData[rData.length - 1];
                value = target.rainfall;
            }
        } else {
            value = findPopulation(feature.properties.province_name, populationData);
        }

        const baseStyle = {
            fillColor: getColor(value, currentDataType, customThresholds),
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.85
        };

        if (currentDataType === DATA_TYPES.RAINFALL) {
            return {
                ...baseStyle,
                color: '#164e63',
                fillOpacity: 0.8
            };
        }

        return {
            ...baseStyle,
            color: '#0D1117'
        };
    };

    const onEachFeature = (feature: any, layer: L.Layer) => {
        const name = feature.properties.province_name || feature.properties.ADM2_AR || feature.properties.ADM1_AR || feature.properties.Name;
        // Get Arabic name properly using utility from upstream
        const nameAr = getGovernorateNameAr(name);

        layer.bindTooltip(() => {
            // MODE: RAINFALL
            if (currentDataType === DATA_TYPES.RAINFALL) {
                const rData = findRainData(feature, rainfallData);
                if (rData) {
                    return generateRainChartHtml(nameAr, rData);
                }
                return `<div class="p-2 text-slate-300 text-xs text-right font-sans">لا توجد بيانات مطرية<br/><span class="font-bold text-white">${nameAr}</span></div>`;
            }

            // MODE: POPULATION
            const pop = findPopulation(name, populationData);
            const config = DATA_TYPE_CONFIG[currentDataType];
            const popStr = pop ? pop.toLocaleString('en-US') : 'لا توجد بيانات';

            return `
                <div class="text-right" style="font-family: 'IBM Plex Sans Arabic', sans-serif;">
                    <div class="font-bold text-base mb-1">${nameAr}</div>
                    <div class="text-sm">${config.labelAr}: ${popStr}</div>
                </div>
            `;
        }, {
            direction: 'top',
            sticky: true,
            className: currentDataType === DATA_TYPES.RAINFALL ? 'custom-tooltip-rain' : 'custom-tooltip',
            opacity: 1,
            offset: [0, -10]
        });

        layer.on({
            mouseover: (e) => {
                const l = e.target;
                const highlightColor = currentDataType === DATA_TYPES.RAINFALL ? '#67e8f9' : '#E6EDF3';

                l.setStyle({
                    weight: 3,
                    color: highlightColor,
                    fillOpacity: 1
                });

                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    l.bringToFront();
                }
            },
            mouseout: (e) => {
                const l = e.target;
                l.setStyle(style(feature));
            },
            click: () => {
                if (onFeatureClick) {
                    onFeatureClick(feature);
                }
            }
        });
    };

    if (!geoJsonData) return null;

    return (
        <div className="w-full h-full relative">
            <style jsx global>{`
                .leaflet-container {
                    -webkit-tap-highlight-color: transparent;
                    outline: none;
                    background: ${currentDataType === DATA_TYPES.RAINFALL ? '#111827' : '#24292F'} !important;
                    transition: background 0.5s ease;
                }
                .leaflet-interactive {
                    outline: none !important;
                    transition: fill 0.3s ease;
                }
                path.leaflet-interactive:focus {
                    outline: none;
                }
                .custom-tooltip-rain {
                    background-color: rgba(15, 23, 42, 0.95);
                    border: 1px solid #334155;
                    color: #f8fafc;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
                    border-radius: 8px;
                    padding: 8px 12px;
                }
                .custom-tooltip-rain:before {
                    border-top-color: rgba(15, 23, 42, 0.95);
                }
                .custom-tooltip {
                    background-color: white;
                    border: 1px solid #ccc;
                    color: #333;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    border-radius: 4px;
                    padding: 6px;
                }
            `}</style>

            <MapContainer
                center={[35.0, 38.5]}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                attributionControl={false}
            >
                <MapUpdater geoJsonData={geoJsonData} />
                <GeoJSON
                    key={`${currentDataType}-${currentSourceId}`}
                    data={geoJsonData}
                    style={style}
                    onEachFeature={onEachFeature}
                />
            </MapContainer>
        </div>
    );
}