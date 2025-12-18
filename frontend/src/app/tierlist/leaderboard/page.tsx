"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, Vote } from "lucide-react";
import { TierAvatar as Avatar } from "@/components/poll/TierAvatar";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
    candidateId: string;
    name: string;
    title?: string | null;
    imageUrl?: string | null;
    votes: number;
    score: number;
    avg: number;
    rank: number;
}

interface LeaderboardData {
    poll: { id: string; title: string };
    [key: string]: any;
}

function formatNumberKM(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function LeaderboardTable({ rows, title }: { rows: LeaderboardEntry[]; title: string }) {
    if (!rows.length) return null;
    return (
        <div className="mb-8">
            <h2 className="font-semibold mb-2">{title}</h2>
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-3 text-right w-12">#</th>
                                    <th className="p-3 text-right">المسؤول</th>
                                    <th className="p-3 text-right w-20">النقاط</th>
                                    <th className="p-3 text-right w-16">الأصوات</th>
                                    <th className="p-3 text-right w-20">المعدّل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.candidateId} className="border-b last:border-0">
                                        <td className="p-3">#{r.rank}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar src={r.imageUrl || ""} alt={r.name} size={28} />
                                                <div>
                                                    <div className="text-sm">{r.name}</div>
                                                    {r.title && <div className="text-xs text-gray-500">{r.title}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">{formatNumberKM(r.score)}</td>
                                        <td className="p-3">{formatNumberKM(r.votes)}</td>
                                        <td className="p-3">{r.avg.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Top3Podium({ rows, title }: { rows: LeaderboardEntry[]; title: string }) {
    if (rows.length < 3) return null;
    const [first, second, third] = rows;
    return (
        <div className="max-w-screen-md mx-auto mb-8">
            <h2 className="font-semibold mb-4 text-center text-gray-500">{title}</h2>
            <div className="grid grid-cols-3 items-end justify-items-center gap-4">
                {/* 2nd */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <Avatar src={second.imageUrl || ""} alt={second.name} size={48} />
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-900 text-white text-[10px] border border-white flex items-center justify-center">2</span>
                    </div>
                    <div className="text-sm mt-1 text-center leading-tight mb-2">{second.name}</div>
                    {second.title && <div className="text-xs text-gray-500 text-center">{second.title}</div>}
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <Avatar src={first.imageUrl || ""} alt={first.name} size={64} />
                        <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-900 text-white text-[10px] border border-white flex items-center justify-center">1</span>
                    </div>
                    <div className="font-medium mt-1 text-center leading-tight mb-2">{first.name}</div>
                    {first.title && <div className="text-xs text-gray-500 text-center">{first.title}</div>}
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <Avatar src={third.imageUrl || ""} alt={third.name} size={48} />
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-900 text-white text-[10px] border border-white flex items-center justify-center">3</span>
                    </div>
                    <div className="text-sm mt-1 text-center leading-tight mb-2">{third.name}</div>
                    {third.title && <div className="text-xs text-gray-500 text-center">{third.title}</div>}
                </div>
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get("/polls/best-ministers/leaderboard")
            .then((response) => {
                setData(response.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching leaderboard:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <main className="container mx-auto px-4 pt-10 pb-8">
                <div className="text-center text-gray-600 dark:text-gray-400">جاري التحميل...</div>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="container mx-auto px-4 pt-10 pb-8">
                <div className="text-center text-gray-600 dark:text-gray-400">لا توجد بيانات.</div>
            </main>
        );
    }

    return (
        <main className="container mx-auto px-4 pt-6 pb-8" dir="rtl">
            {/* Vote Link */}
            <div className="max-w-screen-md mx-auto mb-4 flex justify-end">
                <Link href="/tierlist">
                    <Button variant="outline" className="gap-2">
                        <Vote className="h-4 w-4" />
                        صوّت الآن
                    </Button>
                </Link>
            </div>

            <div className="max-w-screen-md mx-auto mb-4">
                <Alert>
                    <AlertCircleIcon className="h-5 w-5" />
                    <div>
                        <AlertTitle>تنويه</AlertTitle>
                        <AlertDescription>
                            هذه منصّة تصويت مجتمعيّة ذات طابع ساخر، وغايتها الترفيه والمناقشة فحسب. وما يُنشر من نتائج ليس استطلاعاً علميّاً، ولا يُمثّل رأياً رسميّاً.
                        </AlertDescription>
                    </div>
                </Alert>
            </div>

            <h1 className="text-2xl font-bold mb-4 text-center">الإحصائيات</h1>

            {/* Top 3 Ministers */}
            {(data.ministers || data.minister || []).length >= 3 && (
                <Top3Podium rows={(data.ministers || data.minister || []).slice(0, 3)} title="أفضل ٣ على الإطلاق - الحكومة" />
            )}

            {/* Ministers Table */}
            <div className="max-w-screen-md mx-auto">
                <LeaderboardTable rows={data.ministers || data.minister || []} title="قائمة التصنيف التفصيلية - الحكومة" />
            </div>

            {/* Top 3 Governors */}
            {(data.governors || data.governor || []).length >= 3 && (
                <Top3Podium rows={(data.governors || data.governor || []).slice(0, 3)} title="أفضل ٣ - المحافظون" />
            )}

            {/* Governors Table */}
            <div className="max-w-screen-md mx-auto">
                <LeaderboardTable rows={data.governors || data.governor || []} title="قائمة المحافظين" />
            </div>

            {/* Top 3 Security */}
            {(data.security || []).length >= 3 && (
                <Top3Podium rows={(data.security || []).slice(0, 3)} title="أفضل ٣ - مسؤولي الأمن" />
            )}

            {/* Security Table */}
            <div className="max-w-screen-md mx-auto">
                <LeaderboardTable rows={data.security || []} title="قائمة مسؤولي الأمن" />
            </div>

            {/* Top 3 Jolani */}
            {(data.jolani || []).length >= 3 && (
                <Top3Podium rows={(data.jolani || []).slice(0, 3)} title="أفضل ٣ شخصيات الجولاني" />
            )}

            {/* Jolani Table */}
            <div className="max-w-screen-md mx-auto">
                <LeaderboardTable rows={data.jolani || []} title="شخصيات الجولاني" />
            </div>
        </main>
    );
}

