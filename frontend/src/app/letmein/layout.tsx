import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'تسجيل الدخول',
    description: 'تسجيل الدخول إلى حسابك في المساحة السورية.',
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
