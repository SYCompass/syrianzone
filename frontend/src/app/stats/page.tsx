import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'إحصائيات المساحة السورية | Syrian Zone',
    description: 'لوحة معلومات تفاعلية لإحصائيات المساحة السورية.',
    openGraph: {
        images: ['/assets/thumbnail.jpg'],
    },
};

export default function StatsPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="container mx-auto px-4 pt-8 pb-8 flex-grow">
                <div className="bg-card rounded-lg shadow-lg p-2 sm:p-8 h-[calc(100vh-100px)] min-h-[600px] flex flex-col border border-border">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 px-2">إحصائيات المساحة السورية</h1>
                    <div className="flex-grow w-full h-full relative">
                        <iframe
                            width="100%"
                            height="100%"
                            src="https://lookerstudio.google.com/embed/reporting/65f1f763-c5ab-4841-bfba-bd7403d76645/page/KGHXF"
                            className="border-0 absolute inset-0 w-full h-full rounded-md bg-muted"
                            allowFullScreen
                            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                            title="Syrian Statistics Dashboard"
                        />
                    </div>
                </div>
            </main>

            <footer className="bg-card py-6 mt-auto border-t border-border">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <p className="mb-2">&copy; 2025 syrian.zone</p>
                    <p className="text-sm">
                        تم التطوير بواسطة <span className="font-semibold text-foreground">هادي الأحمد</span>
                    </p>
                    <div className="mt-4 flex justify-center gap-6 text-sm">
                        <a href="http://hadealahmad.com/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition flex items-center gap-1">
                            الموقع الشخصي
                        </a>
                        <a href="https://x.com/hadealahmad" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition flex items-center gap-1">
                            Twitter
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
