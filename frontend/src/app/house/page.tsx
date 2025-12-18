import { fetchHouseData } from './data';
import HouseClient from './HouseClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'المجلس التشريعي',
    description: 'أعضاء الهيئات الناخبة والمرشحين والفائزين في انتخابات المجلس التشريعي. تصفح القوائم والإحصاءات.',
    openGraph: {
        title: 'المجلس التشريعي - المساحة السورية',
        description: 'بيانات وإحصاءات انتخابات المجلس التشريعي.',
        images: ['/assets/thumbnail.jpg'],
    }
};

export default async function HousePage() {
    // Initial data load for Damascus Voters (default view)
    const { rows, headers } = await fetchHouseData('voters', 'damascus');

    return (
        <div className="min-h-screen bg-background pb-16">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <HouseClient
                    initialData={rows}
                    initialHeaders={headers}
                    initialMode="voters"
                />
            </div>

            <footer className="py-8 bg-card text-center text-sm text-muted-foreground border-t border-border mt-12">
                <p>&copy; 2025 syrian.zone</p>
                <div className="flex justify-center gap-4 mt-2">
                    <a href="https://hadealahmad.com" target="_blank" className="hover:text-primary transition">الموقع الشخصي</a>
                    <a href="https://x.com/hadealahmad" target="_blank" className="hover:text-primary transition">Twitter</a>
                </div>
            </footer>
        </div>
    );
}
