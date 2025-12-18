'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from '@/lib/axios';

interface User {
    name: string;
    email: string;
    avatar_url: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const res = await axios.get('/user');
            setUser(res.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const isAdmin = !!user; // In current implementation, if logged in, you are admin

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
