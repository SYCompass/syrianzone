import { parseCSVToObjects } from './csv-parser';
import { PopulationGroups } from '../types';
import { DATA_TYPES } from '../constants/data-config';
import { CSV_URL } from '../constants/api-config';
import { DataSource } from '../types/data-types';
import { standardizeCityNames } from '@/lib/city-name-standardizer';

type DataType = typeof DATA_TYPES[keyof typeof DATA_TYPES];

export async function fetchPopulationData(): Promise<PopulationGroups> {
    try {
        const res = await fetch(CSV_URL, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Failed to fetch data');
        const text = await res.text();
        const rawData = parseCSVToObjects(text);

        const dataTypeGroups: PopulationGroups = {
            [DATA_TYPES.POPULATION]: [],
            [DATA_TYPES.IDP]: [],
            [DATA_TYPES.IDP_RETURNEES]: [],
            [DATA_TYPES.RAINFALL]: []
        };

        const sourceMap: { [key: string]: DataSource } = {};

        rawData.forEach(row => {
            const dataType = (row.data_type || 'population') as DataType;
            const sourceId = row.source_id;
            const cityName = row.city_name;

            if (!sourceId || !cityName || !Object.values(DATA_TYPES).includes(dataType)) return;

            const key = `${dataType}_${sourceId}`;

            if (!sourceMap[key]) {
                sourceMap[key] = {
                    source_id: parseInt(sourceId),
                    source_url: row.source_url || '',
                    date: row.date || '',
                    note: row.note || '',
                    data_type: dataType,
                    cities: {}
                };

                if (dataTypeGroups[dataType]) {
                    dataTypeGroups[dataType].push(sourceMap[key]);
                }
            }

            sourceMap[key].cities[cityName] = parseInt(row.population) || 0;
        });

        Object.values(sourceMap).forEach(source => {
            source.cities = standardizeCityNames(source.cities);
        });

        return dataTypeGroups;

    } catch (error) {
        console.error('Error fetching population data:', error);
        return {
            [DATA_TYPES.POPULATION]: [],
            [DATA_TYPES.IDP]: [],
            [DATA_TYPES.IDP_RETURNEES]: [],
            [DATA_TYPES.RAINFALL]: []
        };
    }
}