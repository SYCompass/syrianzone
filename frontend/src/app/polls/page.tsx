'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface Poll {
    id: number;
    slug: string;
    title: string;
    is_active: boolean;
}

export default function PollsPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect non-admins to homepage
    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.replace('/');
        }
    }, [isAdmin, authLoading, router]);

    useEffect(() => {
        if (isAdmin) {
            axios.get('/polls')
                .then(response => {
                    setPolls(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching polls:', error);
                    setLoading(false);
                });
        }
    }, [isAdmin]);

    // Show nothing while checking auth or if not admin
    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Active Polls</h1>
                    <Button asChild>
                        <Link href="/admin/polls/create">
                            Create New Poll
                        </Link>
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {polls.map((poll) => (
                            <div key={poll.id} className="relative bg-card overflow-hidden shadow border border-border rounded-lg hover:shadow-md transition-shadow duration-200">
                                <Link href={`/polls/${poll.slug}`} className="block p-6">
                                    <h3 className="text-lg font-medium hover:text-primary mb-2 transition-colors">
                                        {poll.title}
                                    </h3>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${poll.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {poll.is_active ? 'Active' : 'Closed'}
                                        </span>
                                    </div>
                                </Link>
                                <div className="absolute top-4 right-4 group">
                                    <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                                        <Link href={`/admin/polls/${poll.id}/edit`}>
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
