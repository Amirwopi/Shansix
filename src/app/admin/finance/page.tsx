'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, TrendingUp, Trophy } from 'lucide-react';

type Period = 'weekly' | 'monthly' | 'yearly';

interface FinanceData {
  success: boolean;
  roundsCount: number;
  totals: {
    successfulPayments: number;
    totalRevenue: number;
  };
  winners: Array<{
    id: string;
    userId: string;
    userMobile: string;
    lotteryCode: string;
    drawDate: string;
    prizeAmount: number;
    roundId: string;
    roundNumber: number;
    roundStatus: string;
    roundStartedAt: string;
    roundDrawDate?: string | null;
  }>;
  series: Array<{
    key: string;
    from: string;
    to: string;
    revenue: number;
    count: number;
  }>;
  rounds: Array<{
    id: string;
    number: number;
    status: string;
    startedAt: string;
    closedAt?: string | null;
    drawDate?: string | null;
    capacity: number;
    entryPrice: number;
    winnersCount: number;
    winners: Array<{
      id: string;
      userId: string;
      userMobile: string;
      lotteryCode: string;
      drawDate: string;
      prizeAmount: number;
    }>;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    userId: string;
    userMobile: string;
    roundId: string;
    roundNumber: number | null;
    status: string;
    refId?: string | null;
    paymentDate?: string | null;
    createdAt: string;
  }>;
}

function SimpleBarChart({ values }: { values: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...values.map((v) => v.value));

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-40">
        {values.map((v) => (
          <div key={v.label} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded bg-primary/80"
              style={{ height: `${Math.round((v.value / max) * 100)}%` }}
              title={`${v.label}: ${v.value.toLocaleString('fa-IR')}`}
            />
            <div className="text-[10px] text-muted-foreground truncate w-full text-center">{v.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceData | null>(null);
  const [error, setError] = useState('');

  const fetchReport = async (p: Period) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/finance?period=${encodeURIComponent(p)}`);
      if (response.status === 401) {
        window.location.href = '/';
        return;
      }
      const json = (await response.json()) as FinanceData;
      if (!response.ok || !json.success) {
        setError((json as any).message || 'خطا در دریافت گزارش مالی');
        return;
      }
      setData(json);
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const chartValues = useMemo(() => {
    if (!data) return [];
    const tail = data.series.slice(-12);
    return tail.map((x) => ({ label: x.key, value: x.revenue }));
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">گزارش مالی</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => fetchReport(period)} disabled={loading}>
                <RefreshCw className="ml-2 h-4 w-4" />
                بروزرسانی
              </Button>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = '/admin')}>
                بازگشت به مدیریت
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading || !data ? (
          <div className="text-center text-muted-foreground">در حال بارگذاری...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">تعداد قرعهکشیها</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.roundsCount.toLocaleString('fa-IR')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">درآمد کل (پرداخت موفق)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totals.totalRevenue.toLocaleString('fa-IR')} تومان</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">تعداد پرداختهای موفق</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totals.successfulPayments.toLocaleString('fa-IR')}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>نمودار درآمد</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={period === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('weekly')}
                  >
                    هفتگی
                  </Button>
                  <Button
                    variant={period === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('monthly')}
                  >
                    ماهانه
                  </Button>
                  <Button
                    variant={period === 'yearly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod('yearly')}
                  >
                    سالانه
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {chartValues.length === 0 ? (
                  <div className="text-muted-foreground">داده‌ای برای نمایش وجود ندارد</div>
                ) : (
                  <SimpleBarChart values={chartValues} />
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="winners">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="winners">برندگان</TabsTrigger>
                <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
              </TabsList>

              <TabsContent value="winners" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>لیست برندگان (تمام دوره‌ها)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(data.winners || []).length === 0 ? (
                      <div className="text-muted-foreground">برنده‌ای ثبت نشده است</div>
                    ) : (
                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {data.winners.map((w, idx) => (
                          <div
                            key={w.id}
                            className="border rounded p-4 flex items-center justify-between flex-wrap gap-3 bg-gradient-to-r from-yellow-50/60 to-orange-50/60"
                          >
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4" />
                              <div className="font-semibold">برنده {String(idx + 1).toLocaleString('fa-IR')}</div>
                            </div>
                            <div className="text-sm">دوره: #{w.roundNumber.toLocaleString('fa-IR')}</div>
                            <div className="font-mono">{w.userMobile}</div>
                            <div className="font-mono">کد: {w.lotteryCode}</div>
                            <div className="text-sm">مبلغ جایزه: {w.prizeAmount.toLocaleString('fa-IR')} تومان</div>
                            <Badge variant="outline">{w.roundStatus}</Badge>
                            <div className="text-xs text-muted-foreground">
                              {new Date(w.drawDate).toLocaleString('fa-IR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>لیست پرداخت‌های موفق</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {data.payments.length === 0 ? (
                        <div className="text-muted-foreground">پرداختی ثبت نشده است</div>
                      ) : (
                        data.payments
                          .slice()
                          .reverse()
                          .map((p) => (
                            <div key={p.id} className="border rounded p-3 flex items-center justify-between flex-wrap gap-2">
                              <div className="font-mono">{p.userMobile}</div>
                              <div className="text-sm">{p.amount.toLocaleString('fa-IR')} تومان</div>
                              <div className="text-sm">
                                {p.roundNumber === null
                                  ? 'Round -'
                                  : `Round #${p.roundNumber.toLocaleString('fa-IR')}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(p.paymentDate || p.createdAt).toLocaleString('fa-IR')}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
