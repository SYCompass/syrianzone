export interface CityData {
    [cityName: string]: number;
}

export interface DataSource {
    source_id: number;
    source_url: string;
    date: string;
    note: string;
    cities: CityData;
    data_type?: 'population' | 'idp' | 'idp_returnees';
}

export interface PopulationGroups {
    population: DataSource[];
    idp: DataSource[];
    idp_returnees: DataSource[];
}

export interface PopulationDataResponse {
    dataTypeGroups: PopulationGroups;
}

export const DATA_TYPES = {
    POPULATION: 'population',
    IDP: 'idp',
    IDP_RETURNEES: 'idp_returnees'
} as const;

export type DataType = typeof DATA_TYPES[keyof typeof DATA_TYPES];

export const DATA_TYPE_CONFIG = {
    [DATA_TYPES.POPULATION]: {
        label: 'عدد السكان',
        labelAr: 'السكان',
        colors: { none: '#2a3033', low: '#235A82', medium: '#388BFD', high: '#84B9FF' },
        thresholds: [100000, 500000, 1000000],
        legend: [
            { label: 'لا توجد بيانات', color: '#2a3033' },
            { label: 'أقل من ١٠٠ ألف', color: '#235A82' },
            { label: '١٠٠ ألف – ٥٠٠ ألف', color: '#388BFD' },
            { label: 'أكثر من مليون', color: '#84B9FF' }
        ]
    },
    [DATA_TYPES.IDP]: {
        label: 'النازحين داخلياً',
        labelAr: 'النازحين',
        colors: { none: '#2a3033', low: '#A0522D', medium: '#D2691E', high: '#FF7F50' },
        thresholds: [100000, 500000, 1000000],
        legend: [
            { label: 'لا توجد بيانات', color: '#2a3033' },
            { label: 'أقل من ١٠٠ ألف', color: '#A0522D' },
            { label: '١٠٠ ألف – ٥٠٠ ألف', color: '#D2691E' },
            { label: 'أكثر من ٥٠٠ ألف', color: '#FF7F50' }
        ]
    },
    [DATA_TYPES.IDP_RETURNEES]: {
        label: 'العائدون من النزوح',
        labelAr: 'العائدون',
        colors: { none: '#2a3033', low: '#006400', medium: '#228B22', high: '#32CD32' },
        thresholds: [50000, 100000, 200000],
        legend: [
            { label: 'لا توجد بيانات', color: '#2a3033' },
            { label: 'أقل من ٥٠ ألف', color: '#006400' },
            { label: '٥٠ ألف – ١٠٠ ألف', color: '#228B22' },
            { label: 'أكثر من ١٠٠ ألف', color: '#32CD32' }
        ]
    }
};

export const SHEET_ID = '2PACX-1vS6vFJV6ldATqU0Gi-0tnn-2VPBWz8So0zbVpWoCIdv7f_m7tOyDXPlAsOncPzB_y-LD9ZxgPw9AOAl';
export const CSV_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=csv`;
