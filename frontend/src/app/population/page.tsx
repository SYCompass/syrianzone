import { Metadata } from 'next';
import { fetchPopulationData } from './data';
import PopulationClient from './PopulationClient';

export const metadata: Metadata = {
    title: 'أطلس سكان سوريا | Syrian Zone',
    description: 'أطلس سكان سوريا - خريطة تفاعلية لعدد السكان حسب المحافظات.',
    openGraph: {
        images: ['/assets/thumbnail.jpg'],
    },
};

export default async function PopulationPage() {
    const data = await fetchPopulationData();

    return (
        <div className="min-h-screen bg-background">
            <PopulationClient initialData={data} />
        </div>
    );
}
