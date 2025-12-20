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

import fs from 'fs';
import path from 'path';

export default function Home() {
  const aboutPath = path.join(process.cwd(), 'src/data/about.md');
  const aboutContent = fs.readFileSync(aboutPath, 'utf8');

  return <HomeClient aboutContent={aboutContent} />;
}
