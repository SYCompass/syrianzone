import { Metadata } from 'next';
import { fetchPopulationData } from './data';
import PopulationClient from './PopulationClient';

export const metadata: Metadata = {
    title: 'أطلس سكان سوريا',
    description: 'أطلس سكان سوريا - خريطة تفاعلية لعدد السكان حسب المحافظات.',
    openGraph: {
        title: 'أطلس سكان سوريا - المساحة السورية',
        description: 'أطلس سكان سوريا - خريطة تفاعلية لعدد السكان حسب المحافظات.',
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
