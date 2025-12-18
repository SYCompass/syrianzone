import SyidClient from './SyidClient';
import './page_custom.css';

interface Wallpaper {
    title: string;
    imageSrc: string;
    downloadJpg?: string;
    downloadPng?: string;
    downloadSvg?: string;
    designerName?: string;
    designerLink?: string;
}

async function getWallpapers(): Promise<Wallpaper[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/syid/data.json`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.wallpapers || [];
    } catch {
        return [];
    }
}

export const metadata = {
    title: 'الهوية البصرية السورية - Syrian Visual Identity',
    description: 'الهوية البصرية الرسمية للجمهورية العربية السورية - ألوان العلم، النسب والخطوط الرسمية',
};

export default async function SyidPage() {
    const wallpapers = await getWallpapers();

    return <SyidClient wallpapers={wallpapers} />;
}
