'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Shield, User, CheckCircle2 } from 'lucide-react';

export default function LotteryHomePage() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verified, setVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSendOTP = async () => {
    // Validate mobile number
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">سیستم قرعه‌کشی آنلاین</h1>
            </div>
            <nav className="flex gap-4 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                قوانین
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                راهنما
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                تماس با ما
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">ورود / ثبت‌نام</CardTitle>
            <CardDescription>
              با شماره موبایل ایرانی خود وارد شوید و در قرعه‌کشی شرکت کنید
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="mobile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mobile">
                  <User className="ml-2 h-4 w-4" />
                  شماره موبایل
                </TabsTrigger>
                <TabsTrigger value="otp" disabled={!otpSent}>
                  <Shield className="ml-2 h-4 w-4" />
                  کد تایید
                </TabsTrigger>
              </TabsList>

              {/* Mobile Input Tab */}
              <TabsContent value="mobile" className="space-y-4 mt-4">
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
                    className="text-left dir-ltr"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    شماره موبایل باید با 09 شروع شده و 11 رقم باشد
                  </p>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={loading || mobile.length !== 11}
                  className="w-full"
                >
                  {loading ? 'در حال ارسال...' : 'ارسال کد تایید'}
                </Button>
              </TabsContent>

              {/* OTP Verification Tab */}
              <TabsContent value="otp" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium">
                    کد تایید
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    کد 6 رقمی ارسال شده به {mobile}
                  </p>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full"
                >
                  {loading ? 'در حال بررسی...' : 'تایید و ورود'}
                </Button>

                {/* Resend OTP */}
                {countdown > 0 ? (
                  <p className="text-xs text-center text-muted-foreground">
                    ارسال مجدد کد تا {countdown} ثانیه دیگر امکان‌پذیر است
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full text-sm"
                  >
                    ارسال مجدد کد
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setError('');
                  }}
                  className="w-full text-sm"
                >
                  تغییر شماره موبایل
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm">
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
