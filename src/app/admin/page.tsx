'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Users,
  CreditCard,
  Ticket,
  Trophy,
  Settings,
  Download,
  RefreshCw,
  Play,
  LogOut,
  Search,
  Trash2,
  Edit
} from 'lucide-react';

interface AdminData {
  rounds: Array<{
    id: string;
    number: number;
    status: 'OPEN' | 'CLOSED' | 'DRAWN' | string;
    startedAt: string;
    closedAt?: string | null;
    drawDate?: string | null;
    capacity: number;
    entryPrice: number;
    winnersCount: number;
  }>;
  selectedRound: {
    id: string;
    number: number;
    status: 'OPEN' | 'CLOSED' | 'DRAWN' | string;
    startedAt: string;
    closedAt?: string | null;
    drawDate?: string | null;
    capacity: number;
    entryPrice: number;
    winnersCount: number;
  } | null;
  users: Array<{
    id: string;
    mobile: string;
    isActive: boolean;
    successfulPurchases: number;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    userId: string;
    roundId: string;
    amount: number;
    status: string;
    refId?: string;
    createdAt: string;
  }>;
  lotteryCodes: Array<{
    id: string;
    code: string;
    userId: string;
    roundId: string;
    userMobile: string;
    createdAt: string;
  }>;
  winners: Array<{
    id: string;
    userId: string;
    roundId: string;
    userMobile: string;
    lotteryCode: string;
    drawDate: string;
    prizeAmount: number;
  }>;
  settings: {
    capacity: number;
    entryPrice: number;
    winnersCount: number;
    status: 'OPEN' | 'CLOSED' | 'DRAWN';
    drawDate?: string;
  };
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const query = selectedRoundId ? `?roundId=${encodeURIComponent(selectedRoundId)}` : '';
      const response = await fetch(`/api/admin${query}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);

        if (!selectedRoundId && result?.selectedRound?.id) {
          setSelectedRoundId(result.selectedRound.id);
        }
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

  const handleRunLottery = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید قرعه‌کشی را انجام دهید؟')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/run-lottery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roundId: data?.selectedRound?.id || undefined }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`قرعه‌کشی با موفقیت انجام شد!\n${result.winners.length} برنده انتخاب شدند`);
        fetchAdminData();
      } else {
        alert(result.message || 'خطا در انجام قرعه‌کشی');
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetLottery = async () => {
    if (
      !confirm(
        'این عملیات یک دوره (Round) جدید ایجاد می‌کند و از این به بعد خریدهای جدید داخل دوره جدید ثبت می‌شوند. آیا مطمئن هستید؟'
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        alert('دوره جدید با موفقیت ثبت شد');
        fetchAdminData();
      } else {
        alert(result.message || 'خطا در ثبت دوره جدید');
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/admin/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lottery-report-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('خطا در دانلود گزارش');
    }
  };

  const handleUpdateSettings = async () => {
    if (!data) return;

    const nextCapacityStr = prompt('ظرفیت جدید را وارد کنید:', String(data.settings.capacity));
    if (nextCapacityStr === null) return;

    const nextEntryPriceStr = prompt('هزینه شرکت (تومان) را وارد کنید:', String(data.settings.entryPrice));
    if (nextEntryPriceStr === null) return;

    const nextWinnersCountStr = prompt('تعداد برندگان را وارد کنید:', String(data.settings.winnersCount));
    if (nextWinnersCountStr === null) return;

    const capacity = Number(nextCapacityStr);
    const entryPrice = Number(nextEntryPriceStr);
    const winnersCount = Number(nextWinnersCountStr);

    if (!Number.isInteger(capacity) || capacity <= 0) {
      alert('ظرفیت نامعتبر است');
      return;
    }
    if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
      alert('هزینه شرکت نامعتبر است');
      return;
    }
    if (!Number.isInteger(winnersCount) || winnersCount <= 0) {
      alert('تعداد برندگان نامعتبر است');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ capacity, entryPrice, winnersCount }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || 'خطا در بروزرسانی تنظیمات');
        return;
      }

      setData({
        ...data,
        settings: {
          ...data.settings,
          ...result.settings,
        },
      });

      alert('تنظیمات با موفقیت بروزرسانی شد');
    } catch (err) {
      alert('خطا در ارتباط با سرور');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      // noop
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
          <Button onClick={fetchAdminData} className="mt-4">
            تلاش مجدد
          </Button>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const filteredUsers = data.users.filter(user =>
    user.mobile.includes(searchTerm)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">پنل مدیریت - سیستم قرعه‌کشی</h1>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                دوره جاری: #{(data.selectedRound?.number ?? 0).toLocaleString('fa-IR')}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/admin/finance')}
              >
                گزارش مالی
              </Button>
              <Button variant="outline" size="sm" onClick={fetchAdminData}>
                <RefreshCw className="ml-2 h-4 w-4" />
                بروزرسانی
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="ml-2 h-4 w-4" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">کاربران</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.users.length.toLocaleString('fa-IR')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">پرداخت‌ها</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.payments.length.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">
                {data.payments.filter(p => p.status === 'SUCCESS').length.toLocaleString('fa-IR')} موفق
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">کدهای قرعه‌کشی</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.lotteryCodes.length.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">
                {data.lotteryCodes.length.toLocaleString('fa-IR')} / {(data.selectedRound?.capacity ?? data.settings.capacity).toLocaleString('fa-IR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">برندگان</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.winners.length.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">
                از {data.settings.winnersCount.toLocaleString('fa-IR')} مورد نیاز
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>عملیات سریع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(data.selectedRound?.status === 'OPEN' || data.selectedRound?.status === 'CLOSED') && (
                <Button
                  onClick={handleRunLottery}
                  disabled={actionLoading || data.lotteryCodes.length === 0}
                >
                  <Play className="ml-2 h-4 w-4" />
                  {actionLoading ? 'در حال انجام...' : 'انجام قرعه‌کشی'}
                </Button>
              )}
              <Button variant="outline" onClick={handleUpdateSettings}>
                <Settings className="ml-2 h-4 w-4" />
                تنظیمات قرعه‌کشی
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetLottery}
                disabled={actionLoading}
              >
                <Trash2 className="ml-2 h-4 w-4" />
                {actionLoading ? 'در حال انجام...' : 'ثبت دوره جدید'}
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="ml-2 h-4 w-4" />
                دانلود گزارش
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="users">کاربران</TabsTrigger>
            <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
            <TabsTrigger value="codes">کدها</TabsTrigger>
            <TabsTrigger value="winners">برندگان</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>وضعیت کلی قرعه‌کشی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">وضعیت</p>
                      <div className="text-lg font-semibold mt-1">
                        {getStatusBadge(data.selectedRound?.status ?? data.settings.status)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ظرفیت</p>
                      <p className="text-lg font-semibold mt-1">
                        {data.lotteryCodes.length.toLocaleString('fa-IR')} / {(data.selectedRound?.capacity ?? data.settings.capacity).toLocaleString('fa-IR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">هزینه شرکت</p>
                      <p className="text-lg font-semibold mt-1">
                        {(data.selectedRound?.entryPrice ?? data.settings.entryPrice).toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">تعداد برندگان</p>
                      <p className="text-lg font-semibold mt-1">
                        {(data.selectedRound?.winnersCount ?? data.settings.winnersCount).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">پیشرفت ثبت‌نام</p>
                    <div className="w-full bg-secondary rounded-full h-4">
                      <div
                        className="bg-primary h-4 rounded-full transition-all"
                        style={{
                          width: `${
                            (data.lotteryCodes.length /
                              (data.selectedRound?.capacity ?? data.settings.capacity)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-sm mt-2 text-center">
                      {(
                        (data.lotteryCodes.length /
                          (data.selectedRound?.capacity ?? data.settings.capacity)) *
                        100
                      ).toFixed(1)}% تکمیل شده
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>مدیریت کاربران</CardTitle>
                <CardDescription>
                  تمام کاربران ثبت‌نام شده در سیستم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="جستجو بر اساس شماره موبایل..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      کاربری یافت نشد
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">{user.mobile}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleString('fa-IR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.isActive ? (
                            <Badge className="bg-green-100 text-green-800">فعال</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">غیرفعال</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            خرید موفق: {user.successfulPurchases.toLocaleString('fa-IR')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>مدیریت پرداخت‌ها</CardTitle>
                <CardDescription>
                  تمام تراکنش‌های پرداختی کاربران
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom">
                  {data.payments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      پرداختی ثبت نشده است
                    </p>
                  ) : (
                    data.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold">
                            {payment.amount.toLocaleString('fa-IR')} تومان
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleString('fa-IR')}
                          </p>
                          {payment.refId && (
                            <p className="text-xs text-muted-foreground">
                              شماره پیگیری: {payment.refId}
                            </p>
                          )}
                        </div>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lottery Codes Tab */}
          <TabsContent value="codes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>کدهای قرعه‌کشی</CardTitle>
                <CardDescription>
                  تمام کدهای صادر شده برای کاربران
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-custom">
                  {data.lotteryCodes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      کدی صادر نشده است
                    </p>
                  ) : (
                    data.lotteryCodes.map((code) => (
                      <div
                        key={code.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-mono font-bold text-lg">{code.code}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(code.createdAt).toLocaleString('fa-IR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">معتبر</Badge>
                          <span className="text-xs text-muted-foreground">{code.userMobile}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Winners Tab */}
          <TabsContent value="winners" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>برندگان قرعه‌کشی</CardTitle>
                <CardDescription>
                  کاربرانی که در قرعه‌کشی برنده شده‌اند
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.winners.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">هنوز قرعه‌کشی انجام نشده است</p>
                    <p className="text-sm">برندگان پس از انجام قرعه‌کشی در اینجا نمایش داده می‌شوند</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.winners.map((winner, index) => (
                      <div
                        key={winner.id}
                        className="flex items-center justify-between p-6 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                            <Trophy className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">
                              برنده {index + 1}
                            </p>
                            <p className="font-mono text-sm text-muted-foreground">{winner.userMobile}</p>
                            <p className="font-mono text-sm text-muted-foreground">
                              کد: {winner.lotteryCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              تاریخ قرعه‌کشی: {new Date(winner.drawDate).toLocaleString('fa-IR')}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">برنده</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-sm text-muted-foreground md:flex-row">
            <p>© ۱۴۰۳ سیستم قرعه‌کشی آنلاین - پنل مدیریت</p>
            <p className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              دسترسی محفوظ و ایمن
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
