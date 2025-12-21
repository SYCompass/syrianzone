"use client";

import React, { useEffect } from 'react';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DataType, DATA_TYPE_CONFIG, CityData } from './types';

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
    currentDataType: DataType;
    currentSourceId: number | null;
    customThresholds: number[];
}

function normalizeCityName(name: string): string {
    if (!name) return '';
    return name.trim().replace(/['`]/g, '').replace(/Ḥ/g, 'H').toLowerCase();
}

function findPopulation(provinceName: string, populationData: CityData | null): number {
    if (!populationData) return 0;
    if (populationData[provinceName]) return populationData[provinceName];

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

function getColor(pop: number, dataType: DataType, thresholds: number[]): string {
    const config = DATA_TYPE_CONFIG[dataType];
    if (!config) return '#2a3033';

    if (pop === 0) return config.colors.none;
    if (pop > thresholds[2]) return config.colors.high;
    if (pop > thresholds[1]) return config.colors.medium;
    if (pop > thresholds[0]) return config.colors.low;
    return config.colors.low;
}

function MapUpdater({ geoJsonData }: { geoJsonData: any }) {
    const map = useMap();

    useEffect(() => {
        if (geoJsonData) {
            const layer = L.geoJSON(geoJsonData);
            map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        }
    }, [geoJsonData, map]);

    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [map]);

    return null;
}

export default function MapClient({ geoJsonData, populationData, currentDataType, currentSourceId, customThresholds }: MapClientProps) {

    const style = (feature: any) => {
        const pop = findPopulation(feature.properties.province_name, populationData);
        return {
            fillColor: getColor(pop, currentDataType, customThresholds),
            weight: 1.5,
            opacity: 1,
            color: '#0D1117',
            fillOpacity: 0.85
        };
    };

    const onEachFeature = (feature: any, layer: L.Layer) => {
        const name = feature.properties.province_name;

        layer.bindTooltip(() => {
            const pop = findPopulation(name, populationData);
            const config = DATA_TYPE_CONFIG[currentDataType];
            const popStr = pop ? pop.toLocaleString('en-US') : 'لا توجد بيانات';

            return `
                <div class="text-right" style="font-family: 'IBM Plex Sans Arabic', sans-serif;">
                    <div class="font-bold text-base mb-1">${name}</div>
                    <div class="text-sm">${config.labelAr}: ${popStr}</div>
                </div>
            `;
        }, {
            direction: 'top',
            sticky: true,
            className: 'custom-tooltip'
        });

        layer.on({
            mouseover: (e) => {
                const l = e.target;
                l.setStyle({
                    weight: 3,
                    color: '#E6EDF3',
                    fillOpacity: 1
                });
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    l.bringToFront();
                }
            },
            mouseout: (e) => {
                const l = e.target;
                l.setStyle(style(feature));
            }
        });
    };

    if (!geoJsonData) return null;

    return (
        <div className="w-full h-full relative">
            {/* Global CSS to remove the click rectangle/highlight on mobile */}
            <style jsx global>{`
                .leaflet-container {
                    -webkit-tap-highlight-color: transparent;
                    outline: none;
                }
                .leaflet-interactive {
                    outline: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                /* Removes the blue box on Android/Chrome */
                path.leaflet-interactive:focus {
                    outline: none;
                }
            `}</style>

            <MapContainer
                center={[35.0, 38.5]}
                zoom={7}
                style={{ height: '100%', width: '100%', background: '#24292F' }}
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