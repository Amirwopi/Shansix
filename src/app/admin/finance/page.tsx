'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, CreditCard, Users, Trophy } from 'lucide-react';

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
    userMobile: string;
    lotteryCode: string;
    drawDate: string;
    prizeAmount: number;
    roundNumber: number;
  }>;
  series: Array<{
    key: string;
    revenue: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    userMobile: string;
    roundNumber: number | null;
    status: string;
    refId?: string | null;
    paymentDate?: string | null;
    createdAt: string;
  }>;
}

function roundUpNiceMax(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function formatToman(value: number) {
  return `${value.toLocaleString('fa-IR')} تومان`;
}

function BarChart({ values }: { values: Array<{ label: string; value: number }> }) {
  const [hovered, setHovered] = useState<{ label: string; value: number } | null>(null);

  const { max, ticks } = useMemo(() => {
    const rawMax = Math.max(1, ...values.map((v) => v.value));
    const max = roundUpNiceMax(rawMax);
    const steps = 4;
    const ticks = Array.from({ length: steps + 1 }, (_, i) => (max / steps) * i);
    return { max, ticks };
  }, [values]);

  return (
    <div className="w-full">
      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="flex gap-4">
            <div className="w-16 shrink-0">
              <div className="flex h-72 flex-col justify-between">
                {ticks
                  .slice()
                  .reverse()
                  .map((t) => (
                    <div key={t} className="text-xs text-muted-foreground">
                      {t === 0 ? '0' : t.toLocaleString('fa-IR')}
                    </div>
                  ))}
              </div>
            </div>

            <div className="relative flex-1">
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute left-0 right-0 border-t border-border/60"
                  style={{ bottom: `${(t / max) * 100}%` }}
                />
              ))}

              <div className="relative flex h-72 items-end gap-3">
                {values.map((v) => {
                  const pct = Math.max(0, Math.min(100, (v.value / max) * 100));
                  const isActive = hovered?.label === v.label;
                  return (
                    <div key={v.label} className="flex-1">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          className="relative flex h-72 w-full items-end"
                          onMouseEnter={() => setHovered(v)}
                          onMouseLeave={() => setHovered((cur) => (cur?.label === v.label ? null : cur))}
                          onFocus={() => setHovered(v)}
                          onBlur={() => setHovered((cur) => (cur?.label === v.label ? null : cur))}
                          aria-label={`${v.label}: ${formatToman(v.value)}`}
                        >
                          <div
                            className={
                              "mx-auto w-1 rounded-t bg-green-500/90 transition-all duration-300 ease-in-out hover:bg-green-500 " +
                              (isActive ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-background' : '')
                            }
                            style={{ height: `${pct}%` }}
                          />

                          {isActive ? (
                            <div className="pointer-events-none absolute -top-12 left-1/2 z-10 w-max -translate-x-1/2 rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                              <div className="font-medium">{v.label}</div>
                              <div className="text-muted-foreground">{formatToman(v.value)}</div>
                            </div>
                          ) : null}
                        </button>

                        <div className="w-full truncate text-center text-xs text-muted-foreground">
                          {v.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
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
    return tail.map((x) => {
      const value = Number(x.revenue);
      return { label: x.key, value: Number.isFinite(value) ? value : 0 };
    });
  }, [data]);

  const chartHasData = useMemo(() => {
    return chartValues.some((v) => v.value > 0);
  }, [chartValues]);

  const PaymentStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'SUCCESS': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">موفق</Badge>;
      case 'PENDING': return <Badge variant="secondary">در انتظار</Badge>;
      case 'FAILED': return <Badge variant="destructive">ناموفق</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={() => fetchReport(period)} className="mt-4">تلاش مجدد</Button>
        </Alert>
    );
  }

  if (!data) {
    return <p>اطلاعاتی برای نمایش وجود ندارد.</p>;
  }

  return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">گزارش جامع مالی</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">درآمد کل</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totals.totalRevenue.toLocaleString('fa-IR')} تومان</div>
              <p className="text-xs text-muted-foreground">از تمام پرداخت های موفق</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تراکنش های موفق</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totals.successfulPayments.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">تعداد کل تراکنش های موفق</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تعداد دوره ها</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.roundsCount.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">تعداد کل دوره های برگزار شده</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تعداد برندگان</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.winners.length.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">تعداد کل برندگان در تمام دوره ها</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>نمودار درآمد</CardTitle>
              <CardDescription>نمایش روند درآمد بر اساس بازه زمانی انتخابی.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={period === 'weekly' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('weekly')}>هفتگی</Button>
              <Button variant={period === 'monthly' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('monthly')}>ماهانه</Button>
              <Button variant={period === 'yearly' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('yearly')}>سالانه</Button>
            </div>
          </CardHeader>
          <CardContent>
            {chartValues.length === 0 || !chartHasData ? (
                <div className="text-center py-16 text-muted-foreground">داده‌ای برای نمایش در این بازه زمانی وجود ندارد</div>
            ) : (
                <BarChart values={chartValues} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>لیست تمام پرداخت ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>موبایل</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>دوره</TableHead>
                  <TableHead>تاریخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments.slice().reverse().map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.userMobile}</TableCell>
                      <TableCell>{p.amount.toLocaleString('fa-IR')} تومان</TableCell>
                      <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                      <TableCell>دوره #{p.roundNumber?.toLocaleString('fa-IR')}</TableCell>
                      <TableCell>{new Date(p.paymentDate || p.createdAt).toLocaleString('fa-IR')}</TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}