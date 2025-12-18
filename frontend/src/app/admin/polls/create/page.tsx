'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function AdminPollCreate() {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();

    const [poll, setPoll] = useState({
        title: '',
        slug: '',
        timezone: 'Europe/Amsterdam',
        is_active: true
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post('/polls', poll);
            router.push('/polls');
        } catch (err) {
            console.error(err);
            alert('Error creating poll');
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/polls">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground">Create New Poll</h1>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Creating...' : 'Create Poll'}
                    </Button>
                </div>

                <div className="space-y-6">
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Syrian Government Performance"
                                    value={poll.title}
                                    onChange={e => setPoll({ ...poll, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    placeholder="e.g., govt-2025"
                                    value={poll.slug}
                                    onChange={e => setPoll({ ...poll, slug: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
