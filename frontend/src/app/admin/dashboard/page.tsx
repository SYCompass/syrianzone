'use client';

import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import AdminManagement from './AdminManagement';

export default function AdminDashboard() {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        axios.post('/logout').then(() => {
            router.push('/');
        });
    };
    if (loading) return <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]"><div className="text-center py-20">Loading...</div></div>;



    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <main className="container mx-auto px-4 py-8 mt-16">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                <div className="bg-[var(--bg-secondary)] p-6 rounded-[var(--radius-lg)] border-4 border-[var(--border-color)]">
                    <div className="flex items-center gap-4 mb-6">
                        <img src={user?.avatar_url} alt={user?.name} className="h-16 w-16 rounded-full border-2 border-[var(--sz-color-accent)]" />
                        <div>
                            <p className="text-xl font-bold">Welcome, {user?.name}!</p>
                            <p className="text-[var(--text-secondary)]">{user?.email}</p>
                        </div>
                    </div>
                    <p className="mb-6">You have access to the restricted area.</p>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                    >
                        تسجيل الخروج
                    </button>
                </div>

                <AdminManagement />
            </main>
        </div>
    );
}
