import TierList from './TierList';
import { MINISTERS } from './data';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'تقييم الوزراء',
    description: 'تير ليست وزراء الحكومة السورية الجديدة - تقييم وترتيب الحكومة.',
    openGraph: {
        title: 'تقييم الوزراء - المساحة السورية',
        description: 'تير ليست وزراء الحكومة السورية الجديدة - تقييم وترتيب الحكومة.',
        images: ['/assets/thumbnail.jpg'],
    }
};

export default function MinistersTierListPage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
            <TierList
                initialItems={MINISTERS}
                title="تير ليست وزراء الحكومة السورية الجديدة"
                subtitle="يمكن حفظ صورة جاهزة لمشاركتها على السوشال ميديا بسهولة"
                descriptionDesktop="في نسخة الكمبيوتر: يمكنك سحب وافلات اسم الوزير في القائمة"
                descriptionMobile="في نسخة الموبايل: يمكنك النقر على اسم الوزير ثم النقر على المكان في القائمة لنقله"
            />

            <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                <p>&copy; 2025 تير ليست الحكومة | Ministers Tier List</p>
                <div className="flex justify-center gap-4 mt-2">
                    <a href="https://hadealahmad.com" target="_blank" className="hover:text-[var(--sz-color-primary)]">الموقع الشخصي</a>
                    <a href="https://x.com/hadealahmad" target="_blank" className="hover:text-[var(--sz-color-primary)]">Twitter</a>
                </div>
            </footer>
        </div>
    );
}
