import { Metadata } from 'next';
import { fetchOrganizations } from './data';
import PartyClient from './PartyClient';

export const metadata: Metadata = {
    title: 'دليل المنظمات السياسية السورية',
    description: 'دليل المنظمات السياسية السورية - اكتشف وتصفح المنظمات السياسية السورية.',
    openGraph: {
        title: 'دليل المنظمات السياسية السورية - المساحة السورية',
        description: 'دليل المنظمات السياسية السورية - اكتشف وتصفح المنظمات السياسية السورية.',
        images: ['/assets/thumbnail.jpg'],
    },
};

export default async function PartyPage() {
    const data = await fetchOrganizations();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PartyClient initialOrganizations={data} />

            <footer className="bg-card border-t border-border py-8 mt-auto">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-muted-foreground mb-2">&copy; 2025 syrian.zone</p>
                    <p className="text-sm text-muted-foreground">تم التطوير بواسطة <span className="font-semibold text-foreground">هادي الأحمد</span></p>
                    <div className="flex justify-center gap-6 mt-4">
                        <a href="https://hadealahmad.com" target="_blank" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm">
                            الموقع الشخصي
                        </a>
                        <a href="https://x.com/hadealahmad" target="_blank" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm">
                            Twitter
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
