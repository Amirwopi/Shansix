'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Ticket,
  Clock,
  Users,
  CheckCircle2,
  LogOut,
  User,
  CreditCard
} from 'lucide-react';

interface LotteryData {
  mobile: string;
  lotteryStatus: 'OPEN' | 'CLOSED' | 'DRAWN';
  capacity: number;
  participants: number;
  entryPrice: number;
  winner?: {
    lotteryCode: string;
    drawDate: string;
    prizeAmount: number;
  } | null;
  lotteryCodes: Array<{
    code: string;
    createdAt: string;
  }>;
  payments: Array<{
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LotteryData | null>(null);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 401) {
        window.location.href = '/';
      } else {
        setError('خطا در دریافت اطلاعات');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLottery = async () => {
    setPaymentLoading(true);
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: data?.entryPrice }),
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setError(result.message || 'خطا در ایجاد درخواست پرداخت');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور پرداخت');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      setError('خطا در خروج از حساب');
    } finally {
      window.location.href = '/';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-green-100 text-green-800">باز</Badge>;
      case 'CLOSED':
        return <Badge className="bg-yellow-100 text-yellow-800">بسته</Badge>;
      case 'DRAWN':
        return <Badge className="bg-purple-100 text-purple-800">قرعه‌کشی شده</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800">موفق</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">ناموفق</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={fetchDashboardData} className="mt-4">
            تلاش مجدد
          </Button>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">سیستم قرعه‌کشی آنلاین</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {data.mobile}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="ml-2 h-4 w-4" />
                خروج
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

        {data.lotteryStatus === 'DRAWN' && (
          <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-primary/10 via-yellow-100/40 to-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-2xl font-bold tracking-tight animate-pulse">برنده مشخص شد</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    قرعه‌کشی به پایان رسید و نتیجه اعلام شد.
                  </div>
                </div>

                {data.winner ? (
                  <Badge className="bg-green-100 text-green-800">
                    تبریک! شما برنده شدید
                  </Badge>
                ) : (
                  <Badge className="bg-purple-100 text-purple-800">نتیجه اعلام شد</Badge>
                )}
              </div>

              {data.winner && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border rounded-lg p-3 bg-white/50">
                    <div className="text-xs text-muted-foreground">کد برنده</div>
                    <div className="font-mono font-bold">{data.winner.lotteryCode}</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-white/50">
                    <div className="text-xs text-muted-foreground">مبلغ جایزه</div>
                    <div className="font-bold">{data.winner.prizeAmount.toLocaleString('fa-IR')} تومان</div>
                  </div>
                  <div className="border rounded-lg p-3 bg-white/50">
                    <div className="text-xs text-muted-foreground">زمان قرعه‌کشی</div>
                    <div className="text-sm">{new Date(data.winner.drawDate).toLocaleString('fa-IR')}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">خوش آمدید</CardTitle>
            <CardDescription>
              از پنل کاربری خود برای شرکت در قرعه‌کشی و مدیریت کدهای خود استفاده کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-medium">{data.mobile}</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="ml-1 h-3 w-3" />
                ثبت‌نام شده
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">وضعیت قرعه‌کشی</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{getStatusBadge(data.lotteryStatus)}</div>
              <p className="text-xs text-muted-foreground">
                {data.lotteryStatus === 'OPEN' && 'می‌توانید در قرعه‌کشی شرکت کنید'}
                {data.lotteryStatus === 'CLOSED' && 'قرعه‌کشی بسته شده است'}
                {data.lotteryStatus === 'DRAWN' && 'قرعه‌کسی انجام شده است'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">ظرفیت قرعه‌کشی</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {data.participants.toLocaleString('fa-IR')} / {data.capacity.toLocaleString('fa-IR')}
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(data.participants / data.capacity) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {((data.participants / data.capacity) * 100).toFixed(1)}% تکمیل شده
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">هزینه شرکت</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {data.entryPrice.toLocaleString('fa-IR')} تومان
              </div>
              <p className="text-xs text-muted-foreground">
                پرداخت از طریق درگاه زرین‌پال
              </p>
            </CardContent>
          </Card>
        </div>

        {data.lotteryStatus === 'OPEN' && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">شرکت در قرعه‌کشی</h3>
                  <p className="text-sm text-muted-foreground">
                    با پرداخت هزینه، یک کد قرعه‌کشی دریافت خواهید کرد
                  </p>
                </div>
                <Button
                  onClick={handleJoinLottery}
                  disabled={paymentLoading}
                  size="lg"
                >
                  {paymentLoading ? 'در حال انتقال...' : 'پرداخت و شرکت'}
                  <Ticket className="mr-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">کدهای قرعه‌کشی شما</CardTitle>
            <CardDescription>
              کدهای قرعه‌کشی که پس از پرداخت موفق دریافت کرده‌اید
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.lotteryCodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>هنوز کد قرعه‌کشی ندارید</p>
                <p className="text-sm">برای دریافت کد، در قرعه‌کشی شرکت کنید</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.lotteryCodes.map((code) => (
                  <div
                    key={code.code}
                    className="flex items-center justify-between p-4 border rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-mono font-bold text-lg">{code.code}</p>
                        <p className="text-xs text-muted-foreground">
                          دریافت شده در {new Date(code.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سوابق پرداخت</CardTitle>
            <CardDescription>
              تاریخچه تمام پرداخت‌های شما
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>هنوز پرداختی انجام نداده‌اید</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom">
                {data.payments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">
                          {payment.amount.toLocaleString('fa-IR')} تومان
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    {getPaymentStatusBadge(payment.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-white/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-sm text-muted-foreground md:flex-row">
            <p>© ۱۴۰۳ سیستم قرعه‌کشی آنلاین. تمامی حقوق محفوظ است.</p>
            <p className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              امنیت و محرمانگی اطلاعات شما تضمین شده است
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
