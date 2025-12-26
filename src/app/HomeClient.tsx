'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Shield, User, CheckCircle2 } from 'lucide-react';

export default function HomeClient() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verified, setVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const adminRes = await fetch('/api/admin', { method: 'GET' });
        if (!cancelled && adminRes.ok) {
          router.replace('/admin');
          return;
        }

        const dashboardRes = await fetch('/api/dashboard', { method: 'GET' });
        if (!cancelled && dashboardRes.ok) {
          router.replace('/dashboard');
          return;
        }
      } catch {
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSendOTP = async () => {
    const iranianMobileRegex = /^09\d{9}$/;
    if (!iranianMobileRegex.test(mobile)) {
      setError('لطفاً شماره موبایل معتبر ایرانی وارد کنید (مثال: 09123456789)');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setSuccess('کد تایید با موفقیت ارسال شد');
        setCountdown(120);
        startCountdown();
      } else {
        setError(data.message || 'خطا در ارسال کد تایید');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    let count = 120;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
      }
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('کد تایید باید 6 رقم باشد');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile, code: otp }),
      });

      const data = await response.json();

      if (data.success) {
        setVerified(true);
        const admin = Boolean(data.isAdmin);
        setIsAdmin(admin);
        setSuccess(admin ? 'ورود ادمین موفق! در حال انتقال به پنل مدیریت...' : 'ورود موفق! در حال انتقال به پنل کاربری...');
        setTimeout(() => {
          window.location.href = admin ? '/admin' : '/dashboard';
        }, 2000);
      } else {
        setError(data.message || 'کد تایید نامعتبر است');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">در حال بررسی وضعیت ورود...</p>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">ورود موفق!</CardTitle>
            <CardDescription>{isAdmin ? 'در حال انتقال به پنل مدیریت...' : 'در حال انتقال به پنل کاربری...'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        <div className="flex flex-col items-center justify-center p-8 lg:p-12 order-2 lg:order-1">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    ورود یا ثبت‌نام
                </h1>
                <p className="text-muted-foreground mt-2">
                    برای شرکت در قرعه‌کشی، شماره موبایل خود را وارد کنید
                </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="mobile" value={otpSent ? 'otp' : 'mobile'} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mobile" onClick={() => setOtpSent(false)}>
                  <User className="ml-2 h-4 w-4" />
                  شماره موبایل
                </TabsTrigger>
                <TabsTrigger value="otp" disabled={!otpSent}>
                  <Shield className="ml-2 h-4 w-4" />
                  کد تایید
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mobile" className="space-y-6 pt-6">
                <div className="space-y-2">
                  <label htmlFor="mobile" className="text-sm font-medium">
                    شماره موبایل
                  </label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="09123456789"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    maxLength={11}
                    className="text-lg text-left dir-ltr"
                    disabled={loading}
                  />
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={loading || mobile.length !== 11}
                  className="w-full text-lg py-6"
                >
                  {loading ? 'در حال ارسال...' : 'ارسال کد تایید'}
                </Button>
              </TabsContent>

              <TabsContent value="otp" className="space-y-6 pt-6">
                <div className="space-y-2 text-center">
                  <label htmlFor="otp" className="text-sm font-medium">
                    کد تایید ۶ رقمی را وارد کنید
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="- - - - - -"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-3xl tracking-[1.5rem] font-semibold dir-ltr bg-transparent"
                    disabled={loading}
                  />
                   <p className="text-xs text-muted-foreground text-center pt-2">کد ارسال شده به {mobile}</p>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full text-lg py-6"
                >
                  {loading ? 'در حال بررسی...' : 'تایید و ورود'}
                </Button>

                <div className="text-center text-sm">
                {countdown > 0 ? (
                  <p className="text-muted-foreground">
                    ارسال مجدد کد تا {countdown} ثانیه دیگر
                  </p>
                ) : (
                  <Button
                    variant="link"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="p-0 h-auto"
                  >
                    ارسال مجدد کد
                  </Button>
                )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-center justify-center p-8 lg:p-12 bg-muted/40 order-1 lg:order-2 border-r">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="flex justify-center">
                    <Shield className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tighter">
                    به دنیای شانس خوش آمدید
                </h2>
                <p className="text-muted-foreground">
                    سیستم قرعه‌کشی آنلاین ما با بهره‌گیری از جدیدترین تکنولوژی‌ها، تجربه‌ای امن، شفاف و هیجان‌انگیز را برای شما به ارمغان می‌آورد.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="p-4 rounded-lg bg-background/50 text-center">
                        <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                        <h3 className="font-semibold">امن و مطمئن</h3>
                        <p className="text-sm text-muted-foreground">ورود با کد یکبار مصرف</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 text-center">
                        <User className="h-8 w-8 text-primary mx-auto mb-2" />
                        <h3 className="font-semibold">قرعه‌کشی شفاف</h3>
                        <p className="text-sm text-muted-foreground">نتایج قابل استعلام</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
