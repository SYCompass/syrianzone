import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'تير ليست الحكومة السورية',
    description: 'تقييم مجتمعي لأداء وزراء الحكومة السورية الجديدة.',
    openGraph: {
        title: 'تير ليست الحكومة السورية - المساحة السورية',
        description: 'تقييم مجتمعي لأداء وزراء الحكومة السورية الجديدة.',
        images: ['/assets/thumbnail.jpg'],
    },
};

export default function TierListLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
