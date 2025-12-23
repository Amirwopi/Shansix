'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!token.trim()) {
      setError('توکن الزامی است');
      return;
    }

    setLoading(true);
    setError('');

    // Set admin token cookie
    document.cookie = `admin_token=${token}; path=/; max-age=7*24*60*60`;

    // Redirect to admin panel
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">ورود به پنل مدیریت</CardTitle>
          <CardDescription>
            توکن مدیریت را وارد کنید
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">
                توکن مدیریت
              </label>
              <Input
                id="token"
                type="password"
                placeholder="توکن مدیریت را وارد کنید"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                توکن مدیریت را از فایل .env دریافت کنید (ADMIN_TOKEN)
              </p>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'در حال بررسی...' : 'ورود به پنل'}
            </Button>

            <div className="text-center">
              <a
                href="/"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                بازگشت به صفحه اصلی
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
