import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'الاستبيانات والتقييمات',
    description: 'شارك في الاستبيانات والتقييمات المجتمعية حول القضايا السورية.',
    openGraph: {
        title: 'الاستبيانات - المساحة السورية',
        description: 'شارك في الاستبيانات والتقييمات المجتمعية حول القضايا السورية.',
        images: ['/assets/thumbnail.jpg'],
    },
};

export default function PollsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
