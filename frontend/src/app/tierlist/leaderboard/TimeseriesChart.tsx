"use client"

import { useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HistoryPoint {
    date: string
    votes: number
    score: number
}

interface ItemHistory {
    [candidateId: string]: HistoryPoint[]
}

interface TimeseriesChartProps {
    history: ItemHistory
    candidates: any[]
    title: string
}

export function TimeseriesChart({ history, candidates, title }: TimeseriesChartProps) {
    const [timeRange, setTimeRange] = useState("all")
    const [metric, setMetric] = useState<"votes" | "score">("score")
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>(["all"])

    // Transform data for Recharts
    // We need an array of objects where each object is a date, and keys are candidate IDs
    const chartData = useMemo(() => {
        const dataMap: { [date: string]: any } = {}

        // Get all unique dates
        const allDates = new Set<string>()
        Object.values(history).forEach(points => {
            points.forEach(p => allDates.add(p.date))
        })

        const sortedDates = Array.from(allDates).sort()

        sortedDates.forEach(date => {
            const entry: any = { date: new Date(date).toLocaleDateString('ar-SY') }
            candidates.forEach(c => {
                const candidateHistory = history[c.candidateId]
                const point = candidateHistory?.find(p => p.date === date)
                if (point) {
                    // Improve: accumulate or interpolate? 
                    // For now, raw values. 
                    // But daily_scores are likely cumulative? 
                    // Checking backend: DailyScore is individual day score? 
                    // "votes" and "score" in DailyScore seems to be for THAT day (daily delta).
                    // However, leaderboard shows TOTAL.
                    // If the chart should show PROGRESS, we need cumulative.
                    // If the chart should show DAILY ACTIVITY, we use raw.
                    // User asked for "progress", implying cumulative total over time.
                    // Let's assume we need to calculate cumulative on the frontend if backend returns daily deltas.
                    // Wait, backend `votes` and `score` in DailyScore are deltas for that day.
                    // So we need to accumulate.
                    entry[c.candidateId] = point[metric]
                } else {
                    entry[c.candidateId] = 0
                }
            })
            dataMap[date] = entry
        })

        // Cumulative logic
        const result = []
        const runningTotals: { [key: string]: number } = {}
        candidates.forEach(c => runningTotals[c.candidateId] = 0)

        for (const date of sortedDates) {
            const entry = dataMap[date]
            const cumulativeEntry = { ...entry }

            candidates.forEach(c => {
                runningTotals[c.candidateId] += (entry[c.candidateId] || 0)
                cumulativeEntry[c.candidateId] = runningTotals[c.candidateId]
            })
            result.push(cumulativeEntry)
        }

        // Filter by time range if needed (simplified for now)
        return result
    }, [history, candidates, metric])

    const filteredCandidates = selectedCandidates.includes("all")
        ? candidates.slice(0, 5) // Default show top 5 to avoid clutter
        : candidates.filter(c => selectedCandidates.includes(c.candidateId))

    const colors = [
        "#2563eb", "#dc2626", "#16a34a", "#d97706", "#9333ea",
        "#0891b2", "#be185d", "#4f46e5", "#ca8a04", "#059669"
    ]

    return (
        <Card className="mb-8">
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>تقدم المرشحين عبر الزمن</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {/* Metric Toggle */}
                        <Tabs value={metric} onValueChange={(v) => setMetric(v as any)} className="w-[200px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="score">النقاط</TabsTrigger>
                                <TabsTrigger value="votes">الأصوات</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Range Select (Placeholder logic) */}
                        {/*
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="المدة" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="30d">آخر 30 يوم</SelectItem>
                        <SelectItem value="7d">آخر 7 أيام</SelectItem>
                    </SelectContent>
                </Select>
                */}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Legend />
                            {filteredCandidates.map((candidate, index) => (
                                <Line
                                    key={candidate.candidateId}
                                    type="monotone"
                                    dataKey={candidate.candidateId}
                                    name={candidate.name}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {/* Legend/Toggles could go here if native legend isn't enough */}
                </div>
            </CardContent>
        </Card>
    )
}
