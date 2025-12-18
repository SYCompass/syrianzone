import HomeClient from './HomeClient';

export const metadata = {
  title: 'الصفحة الرئيسية',
  description: 'منصة شاملة للموارد والأدوات السورية',
  openGraph: {
    title: 'المساحة السورية - الصفحة الرئيسية',
    description: 'منصة شاملة للموارد والأدوات السورية',
    images: ['/assets/thumbnail.jpg'],
  },
};

export default function Home() {
  return <HomeClient />;
}
