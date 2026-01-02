import L from 'leaflet';
import { DATA_TYPES, DATA_TYPE_CONFIG, CityData, RainfallData } from '../../types';
import { getCanonicalCityName } from '@/lib/city-name-standardizer';
import { findPopulation, findRainData } from '../../utils/data-finder';
import { generateRainChartHtml, generatePopulationTooltipHtml } from './tooltip-generators';
import { getFeatureStyle, getHighlightStyle } from './map-styles';

type DataType = typeof DATA_TYPES[keyof typeof DATA_TYPES];

export function setupFeatureInteractions(
    feature: any,
    layer: L.Layer,
    currentDataType: DataType,
    populationData: CityData | null,
    rainfallData: RainfallData | undefined,
    customThresholds: number[],
    onFeatureClick?: (feature: any) => void
) {
    const name = feature.properties.province_name || feature.properties.ADM2_AR || feature.properties.ADM1_AR || feature.properties.Name;
    const nameAr = getCanonicalCityName(name);

    // Bind tooltip
    layer.bindTooltip(() => {
        if (currentDataType === DATA_TYPES.RAINFALL) {
            const rData = findRainData(feature, rainfallData);
            if (rData) {
                return generateRainChartHtml(nameAr, rData);
            }
            return `<div class="p-2 text-slate-300 text-xs text-right font-sans">لا توجد بيانات مطرية<br/><span class="font-bold text-white">${nameAr}</span></div>`;
        }

        const pop = findPopulation(name, populationData);
        const config = DATA_TYPE_CONFIG[currentDataType];
        return generatePopulationTooltipHtml(nameAr, pop, config.labelAr);
    }, {
        direction: 'top',
        sticky: true,
        className: currentDataType === DATA_TYPES.RAINFALL ? 'custom-tooltip-rain' : 'custom-tooltip',
        opacity: 1,
        offset: [0, -10]
    });

    // Mouse events
    layer.on({
        mouseover: (e) => {
            const l = e.target;
            const highlightStyle = getHighlightStyle(currentDataType);
            l.setStyle(highlightStyle);

            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                l.bringToFront();
            }
        },
        mouseout: (e) => {
            const l = e.target;
            const style = getFeatureStyle(feature, currentDataType, populationData, rainfallData, customThresholds);
            l.setStyle(style);
        },
        click: () => {
            if (onFeatureClick) {
                onFeatureClick(feature);
            }
        }
    });
}