import SyidClient from './SyidClient';
import './page_custom.css';

export const metadata = {
    title: 'الهوية البصرية السورية',
    description: 'الهوية البصرية الرسمية للجمهورية العربية السورية - ألوان العلم، النسب والخطوط الرسمية',
    openGraph: {
        title: 'الهوية البصرية السورية - المساحة السورية',
        description: 'الهوية البصرية الرسمية للجمهورية العربية السورية - ألوان العلم، النسب والخطوط الرسمية',
        images: ['/assets/thumbnail.jpg'],
    },
};

export default async function SyidPage() {
    return <SyidClient />;
}
