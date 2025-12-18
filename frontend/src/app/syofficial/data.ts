import { OfficialEntity, CSV_URL } from './types';

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

function parseCSVToObjects(csvText: string): OfficialEntity[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = parseCSVRow(lines[0]).map(h => h.trim());
    const data: OfficialEntity[] = [];

    const socialPlatforms = [
        'Facebook URL', 'Instagram URL', 'LinkedIn URL',
        'Telegram URL', 'Telegram URL (Secondary)',
        'Twitter/X URL', 'Website URL', 'WhatsApp URL', 'YouTube URL'
    ];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = parseCSVRow(lines[i]);
        const row: any = {};

        headers.forEach((header, index) => {
            if (index < values.length) {
                row[header] = values[index];
            }
        });

        const category = row['Category']?.toLowerCase().trim();
        if (!category) continue;

        const socials: { [key: string]: string } = {};
        socialPlatforms.forEach(platform => {
            const url = row[platform];
            if (url && url.trim()) {
                let key = platform.toLowerCase()
                    .replace(' url', '')
                    .replace(' (secondary)', '')
                    .replace('twitter/x', 'twitter');
                socials[key] = url.trim();
            }
        });

        data.push({
            id: row['ID'] || `entity-${i}`,
            name: row['Name (English)'] || '',
            name_ar: row['Name (Arabic)'] || '',
            description: row['Description (English)'] || '',
            description_ar: row['Description (Arabic)'] || '',
            image: row['Image Path'] || '',
            category: category.replace(/\s+/g, '_'),
            socials
        });
    }

    return data;
}

export async function fetchOfficialEntities(): Promise<OfficialEntity[]> {
    try {
        const res = await fetch(CSV_URL, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Failed to fetch data');
        const text = await res.text();
        return parseCSVToObjects(text);
    } catch (error) {
        console.error('Error fetching official entities:', error);
        return [];
    }
}
