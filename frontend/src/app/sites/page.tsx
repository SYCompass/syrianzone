import { Metadata } from 'next';
import { fetchWebsites } from './data';
import SitesClient from './SitesClient';

export const metadata: Metadata = {
    title: 'المواقع السورية',
    description: 'دليل المواقع السورية - قائمة شاملة للمواقع السورية مصنفة حسب القطاعات.',
    openGraph: {
        title: 'المواقع السورية - المساحة السورية',
        description: 'دليل المواقع السورية - قائمة شاملة للمواقع السورية مصنفة حسب القطاعات.',
        images: ['/assets/thumbnail.jpg'],
    },
};

export default async function SitesPage() {
    const websites = await fetchWebsites();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SitesClient initialWebsites={websites} />

            <footer className="bg-card border-t border-border py-8 mt-auto">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-muted-foreground mb-2">&copy; 2025 syrian.zone</p>
                    <p className="text-sm text-muted-foreground">تم التطوير بواسطة <span className="font-semibold text-foreground">هادي الأحمد</span></p>
                </div>
            </footer>
        </div>
    );
}
