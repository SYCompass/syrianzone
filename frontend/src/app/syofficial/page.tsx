import { Metadata } from 'next';
import { fetchOfficialEntities } from './data';
import SyOfficialClient from './SyOfficialClient';

export const metadata: Metadata = {
    title: 'Syrian Official Accounts Links | روابط الحسابات الرسمية السورية',
    description: 'Social media directory for Syrian official entities - دليل وسائل التواصل الاجتماعي للجهات السورية الرسمية',
};

export default async function SyOfficialPage() {
    const data = await fetchOfficialEntities();

    return <SyOfficialClient initialData={data} />;
}
