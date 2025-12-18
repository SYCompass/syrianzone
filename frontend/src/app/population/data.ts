import { DataSource, PopulationGroups, CSV_URL, DataType, DATA_TYPES } from './types';

// Helper to parse CSV line handling quotes
function parseCSVRow(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 2;
            } else {
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCSVToObjects(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = parseCSVRow(lines[0]).map(h => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = parseCSVRow(lines[i]);
        const row: any = {};

        headers.forEach((header, index) => {
            if (index < values.length) {
                row[header] = values[index];
            }
        });

        data.push(row);
    }
    return data;
}

export async function fetchPopulationData(): Promise<PopulationGroups> {
    try {
        const res = await fetch(CSV_URL, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Failed to fetch data');
        const text = await res.text();
        const rawData = parseCSVToObjects(text);

        const dataTypeGroups: PopulationGroups = {
            [DATA_TYPES.POPULATION]: [],
            [DATA_TYPES.IDP]: [],
            [DATA_TYPES.IDP_RETURNEES]: []
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

        return dataTypeGroups;

    } catch (error) {
        console.error('Error fetching population data:', error);
        return {
            [DATA_TYPES.POPULATION]: [],
            [DATA_TYPES.IDP]: [],
            [DATA_TYPES.IDP_RETURNEES]: []
        };
    }
}
