"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, FileText, IndianRupee, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
    summary: {
        totalUsers: number;
        totalLoans: number;
        activeLoans: number;
        pendingLoans: number;
        overdueLoans: number;
        paidOffLoans: number;
        totalDisbursed: number;
        totalOutstanding: number;
        totalCollected: number;
        totalInterestEarned: number;
        totalPenaltiesCollected: number;
        collectionEfficiency: number;
    };
    charts: {
        statusDistribution: { name: string; value: number; color: string }[];
        monthlyTrend: { month: string; disbursed: number; collected: number; applications: number }[];
        dailyCollections: { date: string; amount: number }[];
        dailyDisbursements: { date: string; amount: number }[];
    };
}

function formatCurrency(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
    return `₹${amount.toLocaleString('en-IN')}`;
}

function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    description,
    className = ""
}: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    description?: string;
    className?: string;
}) {
    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("30");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                setLoading(true);
                const res = await fetch(`/api/analytics?period=${period}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.message);
                }
            } catch (err) {
                setError("Failed to fetch analytics");
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [period]);

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
                <LoadingSkeleton />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-red-500">{error || "No data available"}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { summary, charts } = data;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Disbursed"
                    value={formatCurrency(summary.totalDisbursed)}
                    icon={IndianRupee}
                    description="All time disbursements"
                />
                <StatCard
                    title="Outstanding Amount"
                    value={formatCurrency(summary.totalOutstanding)}
                    icon={FileText}
                    trend={summary.totalOutstanding > 0 ? 'neutral' : 'up'}
                    description="Current receivables"
                />
                <StatCard
                    title="Total Collected"
                    value={formatCurrency(summary.totalCollected)}
                    icon={CheckCircle}
                    trend="up"
                    description={`${summary.collectionEfficiency}% collection rate`}
                />
                <StatCard
                    title="Interest Earned"
                    value={formatCurrency(summary.totalInterestEarned)}
                    icon={TrendingUp}
                    description="Total interest collected"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard title="Total Users" value={summary.totalUsers} icon={Users} />
                <StatCard title="Active Loans" value={summary.activeLoans} icon={FileText} className="bg-blue-50 dark:bg-blue-950" />
                <StatCard title="Pending Review" value={summary.pendingLoans} icon={Clock} className="bg-yellow-50 dark:bg-yellow-950" />
                <StatCard title="Overdue" value={summary.overdueLoans} icon={AlertTriangle} className="bg-red-50 dark:bg-red-950" />
                <StatCard title="Paid Off" value={summary.paidOffLoans} icon={CheckCircle} className="bg-green-50 dark:bg-green-950" />
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                    <TabsTrigger value="distribution">Distribution</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Trend</CardTitle>
                                <CardDescription>Disbursements vs Collections over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={charts.monthlyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend />
                                        <Bar dataKey="disbursed" name="Disbursed" fill="#3b82f6" />
                                        <Bar dataKey="collected" name="Collected" fill="#22c55e" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Status Distribution</CardTitle>
                                <CardDescription>Current status of all loans</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={charts.statusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {charts.statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Applications Over Time</CardTitle>
                            <CardDescription>Number of loan applications per month</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={charts.monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="applications" name="Applications" stroke="#8884d8" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Collections</CardTitle>
                            <CardDescription>Payment collections in the selected period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={charts.dailyCollections}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="amount" name="Collected" fill="#22c55e" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="distribution" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                        <span>Principal Collected</span>
                                        <span className="font-bold">{formatCurrency(summary.totalCollected - summary.totalInterestEarned - summary.totalPenaltiesCollected)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                        <span>Interest Earned</span>
                                        <span className="font-bold text-green-600">{formatCurrency(summary.totalInterestEarned)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                                        <span>Penalties Collected</span>
                                        <span className="font-bold text-orange-600">{formatCurrency(summary.totalPenaltiesCollected)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
                                        <span className="font-semibold">Total Revenue</span>
                                        <span className="font-bold text-primary">{formatCurrency(summary.totalInterestEarned + summary.totalPenaltiesCollected)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Collection Efficiency</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center h-[200px]">
                                    <div className="text-6xl font-bold text-primary">{summary.collectionEfficiency}%</div>
                                    <p className="text-muted-foreground mt-2">Overall Collection Rate</p>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        {formatCurrency(summary.totalCollected)} collected out of {formatCurrency(summary.totalDisbursed)} disbursed
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
