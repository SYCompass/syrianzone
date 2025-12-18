'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Poll {
    id: string;
    slug: string;
    title: string;
    is_active: boolean;
}

export default function AdminPollsPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/polls')
            .then(res => {
                setPolls(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد أنك تريد حذف هذا التصويت؟')) return;
        try {
            await axios.delete(`/polls/${id}`);
            setPolls(polls.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء حذف التصويت');
        }
    };


    return (
        <div className="min-h-screen bg-background" dir="rtl">
            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground">إدارة التصويتات</h1>
                    <Button asChild>
                        <Link href="/admin/polls/create">
                            <Plus className="ml-2 h-4 w-4" />
                            إنشاء تصويت جديد
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6">
                    {polls.map((poll) => (
                        <Card key={poll.id} className="border-border">
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">{poll.title}</h3>
                                    <p className="text-sm text-muted-foreground text-left" dir="ltr">/{poll.slug}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/admin/polls/${poll.id}/edit`}>
                                            <Edit className="ml-2 h-4 w-4" />
                                            تعديل
                                        </Link>
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(poll.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
