import { Metadata } from 'next';
import { fetchOfficialEntities } from './data';
import SyOfficialClient from './SyOfficialClient';

export const metadata: Metadata = {
    title: 'روابط الحسابات الرسمية السورية',
    description: 'دليل وسائل التواصل الاجتماعي للجهات السورية الرسمية',
    openGraph: {
        title: 'روابط الحسابات الرسمية السورية - المساحة السورية',
        description: 'دليل وسائل التواصل الاجتماعي للجهات السورية الرسمية',
        images: ['/assets/thumbnail.jpg'],
    },
};

export default async function SyOfficialPage() {
    const data = await fetchOfficialEntities();

    return <SyOfficialClient initialData={data} />;
}
