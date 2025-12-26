import { CityData, RainfallData } from '../types';
import { getGovernorateNameAr } from '@/lib/geo-utils';
import { normalizeCityName } from './name-normalizer';
import { PROVINCE_TO_PCODE } from '../constants/province-mappings';

export function findPopulation(provinceName: string, populationData: CityData | null): number {
    if (!populationData) return 0;

    // 1. Try direct match with GeoJSON name
    if (populationData[provinceName]) return populationData[provinceName];

    // 2. Try match with translated Arabic name
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

export function findRainData(feature: any, rainData: RainfallData | undefined) {
    if (!rainData) return null;

    const props = feature.properties;

    // 1. Try Direct P-Code Match
    const codeKeys = ['ADM1_PCODE', 'ADM2_PCODE', 'admin1Pcode', 'admin2Pcode', 'code', 'id', 'PCODE'];
    for (const key of codeKeys) {
        if (props[key] && rainData[props[key]]) {
            return rainData[props[key]];
        }
    }

    // 2. Try Name Match
    const nameKeys = ['province_name', 'ADM1_EN', 'ADM1_AR', 'name', 'Name', 'NAME', 'admin1Name_en'];
    for (const key of nameKeys) {
        if (props[key]) {
            const rawName = props[key];
            const normalized = normalizeCityName(rawName);

            const mappedCode = PROVINCE_TO_PCODE[normalized];
            if (mappedCode && rainData[mappedCode]) {
                return rainData[mappedCode];
            }
        }
    }

    return null;
}