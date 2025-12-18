'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                    Sign in to your account
                </h2>
                {error && (
                    <div className="mt-4 bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded relative">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline"> {error === 'access_denied_admin_only' ? 'Access restricted to administrators.' : 'Authentication failed.'}</span>
                    </div>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-card py-8 px-4 shadow-xl border border-border sm:rounded-lg sm:px-10">
                    <div className="mt-6">
                        <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
                        >
                            Log in with Google
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
