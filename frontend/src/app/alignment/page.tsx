import { Metadata } from 'next';
import CompassClient from './CompassClient';

export const metadata: Metadata = {
    title: 'مولد البوصلة السياسية',
    description: 'أنشئ بوصلتك السياسية الخاصة مع محاور وألوان ونقاط قابلة للتخصيص.',
    openGraph: {
        title: 'مولد البوصلة السياسية - المساحة السورية',
        description: 'أنشئ بوصلتك السياسية الخاصة مع محاور وألوان ونقاط قابلة للتخصيص.',
        images: ['/assets/thumbnail.jpg'],
    },
};

export default function AlignmentPage() {
    return <CompassClient />;
}
