import { DATA_TYPES } from '../../types';
import { getColor } from '../../utils/color-calculator';
import { findPopulation, findRainData } from '../../utils/data-finder';
import { CityData, RainfallData } from '../../types';
type DataType = typeof DATA_TYPES[keyof typeof DATA_TYPES];

export function getFeatureStyle(
    feature: any,
    currentDataType: DataType,
    populationData: CityData | null,
    rainfallData: RainfallData | undefined,
    customThresholds: number[]
) {
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
}

export function getHighlightStyle(currentDataType: DataType) {
    const highlightColor = currentDataType === DATA_TYPES.RAINFALL ? '#67e8f9' : '#E6EDF3';
    
    return {
        weight: 3,
        color: highlightColor,
        fillOpacity: 1
    };
}