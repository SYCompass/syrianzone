import { Metadata } from 'next';
import { fetchGovApps } from './data';
import GovAppsClient from './GovAppsClient';

export const metadata: Metadata = {
    title: 'تطبيقات حكومية | Government Apps',
    description: 'دليل التطبيقات الحكومية السورية الرسمية وروابط التحميل',
    openGraph: {
        title: 'تطبيقات حكومية - الحكومة السورية',
        description: 'دليل التطبيقات الحكومية السورية الرسمية وروابط التحميل',
    },
};

export default async function GovAppsPage() {
    const data = await fetchGovApps();
    return <GovAppsClient initialData={data} />;
}
