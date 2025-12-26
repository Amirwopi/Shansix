'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ticket, Clock, Users, CheckCircle2, CreditCard } from 'lucide-react';

// Interfaces and types remain the same
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
    setError('');
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 401) {
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'خطا در دریافت اطلاعات');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLottery = async () => {
    setPaymentLoading(true);
    setError('');
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  
  // Helper components for badges
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'OPEN': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">باز</Badge>;
      case 'CLOSED': return <Badge variant="secondary">بسته</Badge>;
      case 'DRAWN': return <Badge variant="destructive">قرعه‌کشی شده</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

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

  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchDashboardData} className="mt-4">تلاش مجدد</Button>
      </Alert>
    );
  }

  if (!data) {
    return null; // Or a message indicating no data
  }

  const hasParticipated = data.lotteryCodes.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data.lotteryStatus === 'DRAWN' && data.winner && (
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <CardHeader>
                  <CardTitle>تبریک! شما برنده شدید</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                      <p className="text-sm font-semibold">کد برنده</p>
                      <p className="text-lg font-bold font-mono">{data.winner.lotteryCode}</p>
                  </div>
                  <div>
                      <p className="text-sm font-semibold">مبلغ جایزه</p>
                      <p className="text-lg font-bold">{data.winner.prizeAmount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                      <p className="text-sm font-semibold">زمان قرعه‌کشی</p>
                      <p className="text-lg font-bold">{new Date(data.winner.drawDate).toLocaleString('fa-IR')}</p>
                  </div>
              </CardContent>
          </Card>
      )}

      {data.lotteryStatus === 'DRAWN' && !data.winner && hasParticipated && (
        <Alert variant="destructive">
          <AlertDescription>
            قرعه‌کشی این دوره به پایان رسیده است و متأسفانه شما برنده نشدید.
          </AlertDescription>
        </Alert>
      )}

      {data.lotteryStatus === 'DRAWN' && !data.winner && !hasParticipated && (
        <Alert>
          <AlertDescription>
            قرعه‌کشی این دوره به پایان رسیده است. شما در این دوره شرکت نکرده‌اید.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">وضعیت قرعه‌کشی</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold"><StatusBadge status={data.lotteryStatus} /></div>
                  <p className="text-xs text-muted-foreground">
                      {data.lotteryStatus === 'OPEN' ? 'می‌توانید در قرعه‌کشی شرکت کنید' : 'قرعه کشی بسته شده است'}
                  </p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">ظرفیت</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{data.participants.toLocaleString('fa-IR')} / {data.capacity.toLocaleString('fa-IR')}</div>
                  <p className="text-xs text-muted-foreground">{((data.participants / data.capacity) * 100).toFixed(1)}% تکمیل شده</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">هزینه شرکت</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{data.entryPrice.toLocaleString('fa-IR')} تومان</div>
                  <p className="text-xs text-muted-foreground">پرداخت امن از طریق زرین‌پال</p>
              </CardContent>
          </Card>
      </div>

      {data.lotteryStatus === 'OPEN' && (
          <Card>
              <CardHeader>
                  <CardTitle>شانس خود را امتحان کنید!</CardTitle>
                  <CardDescription>با پرداخت هزینه، یک کد قرعه‌کشی منحصر به فرد دریافت خواهید کرد.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button onClick={handleJoinLottery} disabled={paymentLoading} size="lg">
                      {paymentLoading ? 'در حال انتقال به درگاه...' : 'پرداخت و دریافت کد شانس'}
                      <Ticket className="mr-2 h-5 w-5" />
                  </Button>
              </CardContent>
          </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
          <Card>
              <CardHeader>
                  <CardTitle>کدهای قرعه‌کشی شما</CardTitle>
              </CardHeader>
              <CardContent>
                  {data.lotteryCodes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">شما هنوز کد قرعه‌کشی ندارید.</p>
                  ) : (
                      <div className="space-y-2">
                          {data.lotteryCodes.map(code => (
                              <div key={code.code} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                  <p className="font-mono font-semibold tracking-widest">{code.code}</p>
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>سوابق پرداخت</CardTitle>
              </CardHeader>
              <CardContent>
                  {data.payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">هنوز پرداختی انجام نداده‌اید.</p>
                  ) : (
                      <div className="space-y-2">
                          {data.payments.map((payment, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                  <div className="flex items-center gap-3">
                                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                          <p className="font-semibold">{payment.amount.toLocaleString('fa-IR')} تومان</p>
                                          <p className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleString('fa-IR')}</p>
                                      </div>
                                  </div>
                                  <PaymentStatusBadge status={payment.status} />
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
