'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, UserPlus, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

export default function AdminManagement() {
    const { isSuperAdmin, user: currentUser } = useAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins();
        }
    }, [isSuperAdmin]);

    const fetchAdmins = async () => {
        try {
            const res = await axios.get('/admins');
            setAdmins(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch admins', error);
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post('/admins', {
                email: newAdminEmail,
                name: newAdminName
            });
            setAdmins([...admins, res.data]);
            setNewAdminEmail('');
            setNewAdminName('');
        } catch (error) {
            console.error('Failed to add admin', error);
            alert('Error adding admin');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to remove this admin?')) return;
        try {
            await axios.delete(`/admins/${id}`);
            setAdmins(admins.filter(a => a.id !== id));
        } catch (error) {
            console.error('Failed to remove admin', error);
            alert('Error removing admin');
        }
    };

    if (!isSuperAdmin) return null;

    return (
        <Card className="mt-8 border-border">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Manage Admins
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <form onSubmit={handleAddAdmin} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <Input
                                value={newAdminName}
                                onChange={(e) => setNewAdminName(e.target.value)}
                                placeholder="Admin Name"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <Input
                                type="email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                            />
                        </div>
                        <Button type="submit">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Admin
                        </Button>
                    </form>
                </div>

                <div className="space-y-4">
                    {admins.map((admin) => (
                        <div key={admin.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                                <p className="font-medium">{admin.name}</p>
                                <p className="text-sm text-muted-foreground">{admin.email}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                                    {admin.role}
                                </Badge>
                                {admin.role !== 'superadmin' && admin.id !== currentUser?.id && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(admin.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
