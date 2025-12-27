'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  CreditCard,
  Ticket,
  Trophy,
  Settings,
  Play,
  Search,
  FileUp,
  DollarSign,
  PlusCircle,
  Image as ImageIcon,
  Trash2,
  Save,
} from 'lucide-react';

interface AdminData {
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
  }>;
  selectedRound: {
    id: string;
    number: number;
    status: string;
    startedAt: string;
    closedAt?: string | null;
    drawDate?: string | null;
    capacity: number;
    entryPrice: number;
    winnersCount: number;
  } | null;
  users: Array<{ id: string; mobile: string; instagramId?: string | null; isActive: boolean; successfulPurchases: number; createdAt: string; name: string }>;
  payments: Array<{
    id: string;
    userId: string;
    roundId: string;
    amount: number;
    status: string;
    refId?: string;
    createdAt: string;
    userMobile?: string;
    user?: { mobile?: string };
  }>;
  lotteryCodes: Array<{
    id: string;
    code: string;
    codeNumber?: number;
    userId: string;
    roundId: string;
    userMobile?: string;
    user?: { mobile?: string };
    createdAt: string;
  }>;
  winners: Array<{
    id: string;
    userId: string;
    roundId: string;
    userMobile?: string;
    user?: { mobile?: string };
    lotteryCode: string;
    codeNumber?: number | null;
    roundNumber?: number | null;
    drawDate: string;
    prizeAmount?: number;
    prizeType?: string | null;
  }>;
  settings: { capacity: number; entryPrice: number; winnersCount: number; status: string; drawDate?: string; prizeType?: string | null };
}

type BannerItem = {
  id: string;
  imageUrl: string;
  topText: string | null;
  bottomText: string | null;
  sortOrder: number;
  isActive: boolean;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    capacity: '',
    entryPrice: '',
    winnersCount: '',
    status: 'OPEN' as 'OPEN' | 'CLOSED' | 'DRAWN',
    prizeType: '',
  });

  const [manualWinnerCode, setManualWinnerCode] = useState('');
  const [giftForm, setGiftForm] = useState({ mobile: '', instagramId: '', count: '1' });

  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [newBanner, setNewBanner] = useState({
    imageUrl: '',
    topText: '',
    bottomText: '',
    sortOrder: '0',
    isActive: 'true' as 'true' | 'false',
  });

  const formatDateTime = (value: string) => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Asia/Tehran',
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'short',
        timeZone: 'Asia/Tehran',
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  useEffect(() => {
    fetchAdminData(selectedRoundId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoundId]);

  useEffect(() => {
    if (activeTab === 'banners') {
      fetchBannerItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchAdminData = async (roundId: string) => {
    setLoading(true);
    setError('');
    try {
      const query = roundId ? `?roundId=${encodeURIComponent(roundId)}` : '';
      const response = await fetch(`/api/admin${query}`, { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        setData(result);
        if (!roundId && result?.selectedRound?.id) {
          setSelectedRoundId(result.selectedRound.id);
        }
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

  const handleRunLottery = async () => {
    const code = (manualWinnerCode || '').trim();
    if (!code) {
      setError('کد لاتاری برای ثبت برنده الزامی است');
      return;
    }

    if (!confirm('آیا مطمئن هستید که می‌خواهید این کد را به عنوان برنده ثبت کنید؟ این عملیات غیرقابل بازگشت است.')) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/run-lottery', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId: selectedRoundId, lotteryCode: code }),
      });
      const result = await response.json();
      if (result.success) {
        alert('برنده با موفقیت ثبت شد.');
        setManualWinnerCode('');
        await fetchAdminData(selectedRoundId);
      } else {
        setError(result.message || 'خطا در انجام قرعه‌کشی');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNewRound = async () => {
    if (!confirm('آیا برای ایجاد یک دوره جدید مطمئن هستید؟ دوره فعلی بسته خواهد شد.')) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/reset', { method: 'POST', credentials: 'include' });
      const result = await response.json();
      if (result.success && result.newRound) {
        alert('دوره جدید با موفقیت ایجاد شد.');
        setSelectedRoundId(result.newRound.id);
      } else {
        setError(result.message || 'خطا در ایجاد دوره جدید');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportExcel = async () => {
    const url = selectedRoundId ? `/api/admin/export?roundId=${selectedRoundId}` : '/api/admin/export';
    window.open(url, '_blank');
  };

  const handleUpdateSettings = async () => {
    if (!data) return;
    setSettingsError('');
    setSettingsForm({
      capacity: String(data.settings.capacity ?? ''),
      entryPrice: String(data.settings.entryPrice ?? ''),
      winnersCount: String(data.settings.winnersCount ?? ''),
      status: (data.settings.status as any) || 'OPEN',
      prizeType: String((data.settings as any).prizeType ?? ''),
    });
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError('');
    try {
      const capacity = Number(settingsForm.capacity);
      const entryPrice = Number(settingsForm.entryPrice);
      const winnersCount = Number(settingsForm.winnersCount);
      const status = settingsForm.status;
      const prizeType = settingsForm.prizeType.trim();

      if (!Number.isInteger(capacity) || capacity <= 0) {
        setSettingsError('ظرفیت باید عدد صحیح بزرگتر از صفر باشد.');
        return;
      }
      if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
        setSettingsError('هزینه شرکت باید عدد بزرگتر از صفر باشد.');
        return;
      }
      if (!Number.isInteger(winnersCount) || winnersCount <= 0) {
        setSettingsError('تعداد برندگان باید عدد صحیح بزرگتر از صفر باشد.');
        return;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity, entryPrice, winnersCount, status, prizeType }),
      });

      const json = await response.json().catch(() => ({} as any));

      if (response.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!response.ok || !json?.success) {
        setSettingsError(json?.message || 'خطا در ذخیره تنظیمات');
        return;
      }

      setSettingsOpen(false);
      await fetchAdminData(selectedRoundId);
    } catch {
      setSettingsError('خطا در ارتباط با سرور');
    } finally {
      setSettingsSaving(false);
    }
  };

  const fetchBannerItems = async () => {
    setBannerLoading(true);
    setBannerError('');
    try {
      const res = await fetch('/api/admin/dashboard-banners', { cache: 'no-store', credentials: 'include' });
      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!res.ok || !json?.success) {
        setBannerError(json?.message || 'خطا در دریافت بنرها');
        setBannerItems([]);
        return;
      }

      setBannerItems(Array.isArray(json.items) ? json.items : []);
    } catch {
      setBannerError('خطا در ارتباط با سرور');
      setBannerItems([]);
    } finally {
      setBannerLoading(false);
    }
  };

  const createBannerItem = async () => {
    setBannerError('');

    const imageUrl = newBanner.imageUrl.trim();
    if (!imageUrl) {
      setBannerError('آدرس عکس الزامی است');
      return;
    }

    const sortOrder = Number(newBanner.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      setBannerError('ترتیب باید عدد باشد');
      return;
    }

    try {
      const res = await fetch('/api/admin/dashboard-banners', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          topText: newBanner.topText.trim() || null,
          bottomText: newBanner.bottomText.trim() || null,
          sortOrder,
          isActive: newBanner.isActive === 'true',
        }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!res.ok || !json?.success) {
        setBannerError(json?.message || 'خطا در ایجاد بنر');
        return;
      }

      setNewBanner({ imageUrl: '', topText: '', bottomText: '', sortOrder: '0', isActive: 'true' });
      await fetchBannerItems();
    } catch {
      setBannerError('خطا در ارتباط با سرور');
    }
  };

  const saveBannerItem = async (id: string, item: BannerItem) => {
    setBannerError('');

    const imageUrl = item.imageUrl.trim();
    if (!imageUrl) {
      setBannerError('آدرس عکس الزامی است');
      return;
    }

    try {
      const res = await fetch(`/api/admin/dashboard-banners/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          topText: item.topText?.trim() || null,
          bottomText: item.bottomText?.trim() || null,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!res.ok || !json?.success) {
        setBannerError(json?.message || 'خطا در بروزرسانی بنر');
        return;
      }

      await fetchBannerItems();
    } catch {
      setBannerError('خطا در ارتباط با سرور');
    }
  };

  const deleteBannerItem = async (id: string) => {
    if (!confirm('حذف شود؟')) return;

    setBannerError('');
    try {
      const res = await fetch(`/api/admin/dashboard-banners/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!res.ok || json?.success === false) {
        setBannerError(json?.message || 'خطا در حذف بنر');
        return;
      }

      await fetchBannerItems();
    } catch {
      setBannerError('خطا در ارتباط با سرور');
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return { users: [], payments: [], lotteryCodes: [] };
    const lowercasedFilter = searchTerm.toLowerCase();
    const getMobileFromPayment = (p: AdminData['payments'][number]) => (p.user?.mobile ?? p.userMobile ?? '').toString();
    const getMobileFromCode = (c: AdminData['lotteryCodes'][number]) => (c.user?.mobile ?? c.userMobile ?? '').toString();
    return {
      users: data.users.filter((u) => {
        const mobile = (u.mobile ?? '').toString();
        const name = (u.name ?? '').toString().toLowerCase();
        const instagram = (u.instagramId ?? '').toString().toLowerCase();
        return mobile.includes(lowercasedFilter) || instagram.includes(lowercasedFilter) || name.includes(lowercasedFilter);
      }),
      payments: data.payments.filter((p) => getMobileFromPayment(p).includes(lowercasedFilter)),
      lotteryCodes: data.lotteryCodes.filter(
          (c) => getMobileFromCode(c).includes(lowercasedFilter) || c.code.toLowerCase().includes(lowercasedFilter)
      ),
    };
  }, [data, searchTerm]);

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'OPEN':
        return (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              باز
            </Badge>
        );
      case 'CLOSED':
        return <Badge variant="secondary">بسته</Badge>;
      case 'DRAWN':
        return <Badge variant="destructive">قرعه‌کشی شده</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const PaymentStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'SUCCESS':
        return (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              موفق
            </Badge>
        );
      case 'PENDING':
        return <Badge variant="secondary">در انتظار</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">ناموفق</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
          <Button onClick={() => fetchAdminData(selectedRoundId)} className="mt-4">
            تلاش مجدد
          </Button>
        </Alert>
    );
  }

  if (!data) {
    return <p>اطلاعاتی برای نمایش وجود ندارد.</p>;
  }

  const totalRevenue = data.payments.filter((p) => p.status === 'SUCCESS').reduce((acc, p) => acc + p.amount, 0);
  const canRunLottery =
      !actionLoading &&
      !!data.selectedRound?.status &&
      (data.selectedRound.status === 'OPEN' || data.selectedRound.status === 'CLOSED') &&
      data.lotteryCodes.length > 0;

  const canGiftLotteryCode =
      !actionLoading &&
      !!data.selectedRound?.status &&
      data.selectedRound.status === 'OPEN';

  const handleGiftLotteryCode = async () => {
    setActionLoading(true);
    setError('');
    try {
      const mobile = giftForm.mobile.trim();
      const instagramId = giftForm.instagramId.trim();
      const count = Number(giftForm.count);

      if (!data.selectedRound || data.selectedRound.status !== 'OPEN') {
        setError('برای صدور کد هدیه، ابتدا باید یک دوره باز (OPEN) از طریق تنظیمات ایجاد کنید.');
        return;
      }

      if (!mobile && !instagramId) {
        setError('شماره موبایل یا آیدی اینستاگرام الزامی است');
        return;
      }
      if (!Number.isInteger(count) || count <= 0) {
        setError('تعداد کد باید عدد صحیح بزرگتر از صفر باشد');
        return;
      }

      const response = await fetch('/api/admin/gift-lottery-code', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobile || undefined,
          instagramId: instagramId || undefined,
          roundId: data.selectedRound.status === 'OPEN' ? selectedRoundId : undefined,
          count,
        }),
      });

      const json = await response.json().catch(() => ({} as any));

      if (response.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!response.ok || !json?.success) {
        setError(json?.message || 'خطا در صدور کد هدیه');
        return;
      }

      alert('کد هدیه با موفقیت صادر شد');
      setGiftForm({ mobile: '', instagramId: '', count: '1' });
      await fetchAdminData(selectedRoundId);
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setActionLoading(false);
    }
  };

  return (
      <div className="flex flex-col gap-6">
        {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold">مدیریت قرعه کشی</h1>
          <div className="flex items-center gap-2">
            <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="انتخاب دوره" />
              </SelectTrigger>
              <SelectContent>{data.rounds.map((r) => <SelectItem key={r.id} value={r.id}>دوره #{r.number}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={handleCreateNewRound} disabled={actionLoading} size="sm">
              <PlusCircle className="ml-2 h-4 w-4" />
              ایجاد دوره جدید
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">درآمد کل این دوره</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString('fa-IR')} تومان</div>
              <p className="text-xs text-muted-foreground">از پرداخت های موفق</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">شرکت کنندگان</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.lotteryCodes.length.toLocaleString('fa-IR')} / {data.settings.capacity.toLocaleString('fa-IR')}
              </div>
              <p className="text-xs text-muted-foreground">نفر در این دوره</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">وضعیت دوره</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <StatusBadge status={data.selectedRound?.status ?? ''} />
              </div>
              <p className="text-xs text-muted-foreground">وضعیت فعلی دوره انتخاب شده</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">برندگان</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.winners.length.toLocaleString('fa-IR')} / {data.settings.winnersCount.toLocaleString('fa-IR')}
              </div>
              <p className="text-xs text-muted-foreground">نفر از تعداد مورد نیاز</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>عملیات مدیریتی</CardTitle>
            <CardDescription>ابزارهای اصلی برای مدیریت دوره فعلی قرعه کشی.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium">ثبت برنده با کد لاتاری</div>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  value={manualWinnerCode}
                  onChange={(e) => setManualWinnerCode(e.target.value)}
                  placeholder="LOT-XXXX-YYYY"
                  className="font-mono"
                  disabled={actionLoading}
                />
                <Button onClick={handleRunLottery} disabled={!canRunLottery}>
                  <Play className="ml-2 h-4 w-4" />
                  ثبت برنده
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                قرعه‌کشی اتوماتیک حذف شده است؛ برنده فقط با وارد کردن کد لاتاری توسط ادمین ثبت می‌شود.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleUpdateSettings}>
                <Settings className="ml-2 h-4 w-4" />
                تنظیمات
              </Button>
              <Button variant="secondary" onClick={handleExportExcel}>
                <FileUp className="ml-2 h-4 w-4" />
                خروجی اکسل
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>هدیه کد لاتاری</CardTitle>
            <CardDescription>ادمین می‌تواند به کاربر بر اساس شماره موبایل یا آیدی اینستاگرام کد هدیه بدهد.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="grid gap-2">
                <div className="text-sm font-medium">شماره موبایل</div>
                <Input
                  value={giftForm.mobile}
                  onChange={(e) => setGiftForm((s) => ({ ...s, mobile: e.target.value }))}
                  placeholder="09123456789"
                  className="text-left dir-ltr"
                  disabled={actionLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-medium">آیدی اینستاگرام</div>
                <Input
                  value={giftForm.instagramId}
                  onChange={(e) => setGiftForm((s) => ({ ...s, instagramId: e.target.value }))}
                  placeholder="your_id"
                  className="text-left dir-ltr"
                  disabled={actionLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-medium">تعداد کد</div>
                <Input
                  inputMode="numeric"
                  value={giftForm.count}
                  onChange={(e) => setGiftForm((s) => ({ ...s, count: e.target.value }))}
                  placeholder="1"
                  disabled={actionLoading}
                />
              </div>
            </div>
            <div>
              <Button onClick={handleGiftLotteryCode} disabled={!canGiftLotteryCode}>
                صدور کد هدیه
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تنظیمات قرعه‌کشی</DialogTitle>
              <DialogDescription>
                با ذخیره تنظیمات، یک دوره جدید ایجاد می‌شود و دوره باز فعلی (اگر وجود داشته باشد) بسته خواهد شد.
              </DialogDescription>
            </DialogHeader>

            {settingsError ? (
                <Alert variant="destructive">
                  <AlertDescription>{settingsError}</AlertDescription>
                </Alert>
            ) : null}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="text-sm font-medium">ظرفیت</div>
                <Input
                    inputMode="numeric"
                    value={settingsForm.capacity}
                    onChange={(e) => setSettingsForm((s) => ({ ...s, capacity: e.target.value }))}
                    placeholder="مثلاً 1000"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium">هزینه شرکت (تومان)</div>
                <Input
                    inputMode="numeric"
                    value={settingsForm.entryPrice}
                    onChange={(e) => setSettingsForm((s) => ({ ...s, entryPrice: e.target.value }))}
                    placeholder="مثلاً 50000"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium">تعداد برندگان</div>
                <Input
                    inputMode="numeric"
                    value={settingsForm.winnersCount}
                    onChange={(e) => setSettingsForm((s) => ({ ...s, winnersCount: e.target.value }))}
                    placeholder="مثلاً 1"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium">وضعیت</div>
                <Select
                    value={settingsForm.status}
                    onValueChange={(v) => setSettingsForm((s) => ({ ...s, status: v as 'OPEN' | 'CLOSED' | 'DRAWN' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">باز</SelectItem>
                    <SelectItem value="CLOSED">بسته</SelectItem>
                    <SelectItem value="DRAWN">قرعه‌کشی شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium">نوع جایزه</div>
                <Input
                  value={settingsForm.prizeType}
                  onChange={(e) => setSettingsForm((s) => ({ ...s, prizeType: e.target.value }))}
                  placeholder="مثلاً: کارت هدیه ۵۰۰ هزار تومانی"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)} disabled={settingsSaving}>
                انصراف
              </Button>
              <Button onClick={handleSaveSettings} disabled={settingsSaving}>
                {settingsSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="users">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">کاربران</TabsTrigger>
            <TabsTrigger value="payments">پرداخت ها</TabsTrigger>
            <TabsTrigger value="codes">کدها</TabsTrigger>
            <TabsTrigger value="winners">برندگان</TabsTrigger>
            <TabsTrigger value="banners">بنر داشبورد</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>لیست کاربران</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="جستجو بر اساس موبایل، نام کاربر یا آیدی اینستاگرام..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">شماره موبایل</TableHead>
                        <TableHead className="whitespace-nowrap">نام کاربر</TableHead>
                        <TableHead className="whitespace-nowrap">آیدی اینستاگرام</TableHead>
                        <TableHead className="whitespace-nowrap">وضعیت</TableHead>
                        <TableHead className="whitespace-nowrap">تعداد خرید</TableHead>
                        <TableHead className="whitespace-nowrap">تاریخ عضویت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono whitespace-nowrap dir-ltr text-left">{user.mobile}</TableCell>
                            <TableCell className="whitespace-nowrap">{user.name ?? '-'}</TableCell>
                            <TableCell className="font-mono whitespace-nowrap dir-ltr text-left">{user.instagramId ?? '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {user.isActive ? (
                                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                    فعال
                                  </Badge>
                              ) : (
                                  <Badge variant="secondary">غیرفعال</Badge>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{user.successfulPurchases.toLocaleString('fa-IR')}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(user.createdAt)}</TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>تاریخچه پرداخت ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">موبایل</TableHead>
                        <TableHead className="whitespace-nowrap">مبلغ</TableHead>
                        <TableHead className="whitespace-nowrap">وضعیت</TableHead>
                        <TableHead className="whitespace-nowrap">تاریخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="whitespace-nowrap dir-ltr text-left font-mono">{p.user?.mobile ?? p.userMobile ?? '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{p.amount.toLocaleString('fa-IR')} تومان</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <PaymentStatusBadge status={p.status} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{formatDateTime(p.createdAt)}</TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="codes">
            <Card>
              <CardHeader>
                <CardTitle>کدهای صادر شده</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">شماره</TableHead>
                        <TableHead className="whitespace-nowrap">کد</TableHead>
                        <TableHead className="whitespace-nowrap">موبایل</TableHead>
                        <TableHead className="whitespace-nowrap">تاریخ صدور</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.lotteryCodes.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="whitespace-nowrap">{c.codeNumber ?? '-'}</TableCell>
                            <TableCell className="font-mono tracking-widest whitespace-nowrap dir-ltr text-left">{c.code}</TableCell>
                            <TableCell className="whitespace-nowrap dir-ltr text-left font-mono">{c.user?.mobile ?? c.userMobile ?? '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(c.createdAt)}</TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="winners">
            <Card>
              <CardHeader>
                <CardTitle>لیست برندگان</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">دوره</TableHead>
                        <TableHead className="whitespace-nowrap">شماره کد</TableHead>
                        <TableHead className="whitespace-nowrap">موبایل</TableHead>
                        <TableHead className="whitespace-nowrap">کد برنده</TableHead>
                        <TableHead className="whitespace-nowrap">نوع جایزه</TableHead>
                        <TableHead className="whitespace-nowrap">تاریخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.winners.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell className="whitespace-nowrap">{w.roundNumber ?? '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{w.codeNumber ?? '-'}</TableCell>
                            <TableCell className="whitespace-nowrap dir-ltr text-left font-mono">{w.user?.mobile ?? w.userMobile ?? '-'}</TableCell>
                            <TableCell className="font-mono tracking-widest whitespace-nowrap dir-ltr text-left">{w.lotteryCode}</TableCell>
                            <TableCell className="whitespace-nowrap">{w.prizeType ?? data.settings.prizeType ?? '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(w.drawDate)}</TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners">
            <div className="flex flex-col gap-4">
              {bannerError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{bannerError}</AlertDescription>
                  </Alert>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    افزودن بنر جدید
                  </CardTitle>
                  <CardDescription>عکس + توضیح بالا + توضیح پایین (نمایش ریسپانسیو در داشبورد)</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <div className="text-sm font-medium">آدرس عکس (URL)</div>
                    <Input
                        value={newBanner.imageUrl}
                        onChange={(e) => setNewBanner((s) => ({ ...s, imageUrl: e.target.value }))}
                        placeholder="https://..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm font-medium">متن بالا</div>
                    <Textarea
                        value={newBanner.topText}
                        onChange={(e) => setNewBanner((s) => ({ ...s, topText: e.target.value }))}
                        placeholder="اختیاری"
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm font-medium">متن پایین</div>
                    <Textarea
                        value={newBanner.bottomText}
                        onChange={(e) => setNewBanner((s) => ({ ...s, bottomText: e.target.value }))}
                        placeholder="اختیاری"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <div className="text-sm font-medium">ترتیب</div>
                      <Input
                          inputMode="numeric"
                          value={newBanner.sortOrder}
                          onChange={(e) => setNewBanner((s) => ({ ...s, sortOrder: e.target.value }))}
                          placeholder="0"
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="text-sm font-medium">فعال باشد؟</div>
                      <Select
                          value={newBanner.isActive}
                          onValueChange={(v) => setNewBanner((s) => ({ ...s, isActive: v as 'true' | 'false' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">فعال</SelectItem>
                          <SelectItem value="false">غیرفعال</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newBanner.imageUrl ? (
                      <div className="rounded-lg border overflow-hidden">
                        <img src={newBanner.imageUrl} alt="preview" className="w-full h-48 object-cover" />
                      </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <Button onClick={createBannerItem} disabled={bannerLoading}>
                      {bannerLoading ? 'در حال انجام...' : 'افزودن'}
                    </Button>
                    <Button variant="outline" onClick={fetchBannerItems} disabled={bannerLoading}>
                      بروزرسانی لیست
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>لیست بنرها</CardTitle>
                  <CardDescription>هر ردیف را تغییر بده و سپس «ذخیره» را بزن.</CardDescription>
                </CardHeader>
                <CardContent>
                  {bannerLoading ? (
                      <div className="text-sm text-muted-foreground">در حال دریافت...</div>
                  ) : bannerItems.length === 0 ? (
                      <div className="text-sm text-muted-foreground">بنری ثبت نشده است.</div>
                  ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>پیش‌نمایش</TableHead>
                            <TableHead>آدرس عکس</TableHead>
                            <TableHead>متن بالا</TableHead>
                            <TableHead>متن پایین</TableHead>
                            <TableHead>ترتیب</TableHead>
                            <TableHead>وضعیت</TableHead>
                            <TableHead>عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bannerItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="w-[140px]">
                                  <div className="w-[120px] h-[70px] rounded-md overflow-hidden border bg-muted/20">
                                    <img src={item.imageUrl} alt="banner" className="w-full h-full object-cover" />
                                  </div>
                                </TableCell>

                                <TableCell className="min-w-[260px]">
                                  <Input
                                      value={item.imageUrl}
                                      onChange={(e) =>
                                          setBannerItems((prev) =>
                                              prev.map((x) => (x.id === item.id ? { ...x, imageUrl: e.target.value } : x))
                                          )
                                      }
                                  />
                                </TableCell>

                                <TableCell className="min-w-[220px]">
                                  <Textarea
                                      value={item.topText ?? ''}
                                      onChange={(e) =>
                                          setBannerItems((prev) =>
                                              prev.map((x) => (x.id === item.id ? { ...x, topText: e.target.value } : x))
                                          )
                                      }
                                  />
                                </TableCell>

                                <TableCell className="min-w-[220px]">
                                  <Textarea
                                      value={item.bottomText ?? ''}
                                      onChange={(e) =>
                                          setBannerItems((prev) =>
                                              prev.map((x) => (x.id === item.id ? { ...x, bottomText: e.target.value } : x))
                                          )
                                      }
                                  />
                                </TableCell>

                                <TableCell className="w-[110px]">
                                  <Input
                                      inputMode="numeric"
                                      value={String(item.sortOrder)}
                                      onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setBannerItems((prev) =>
                                            prev.map((x) =>
                                                x.id === item.id ? { ...x, sortOrder: Number.isFinite(v) ? v : 0 } : x
                                            )
                                        );
                                      }}
                                  />
                                </TableCell>

                                <TableCell className="w-[130px]">
                                  <Select
                                      value={item.isActive ? 'true' : 'false'}
                                      onValueChange={(v) =>
                                          setBannerItems((prev) =>
                                              prev.map((x) => (x.id === item.id ? { ...x, isActive: v === 'true' } : x))
                                          )
                                      }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="true">فعال</SelectItem>
                                      <SelectItem value="false">غیرفعال</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>

                                <TableCell className="w-[220px]">
                                  <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => saveBannerItem(item.id, item)}
                                        disabled={bannerLoading}
                                    >
                                      <Save className="ml-2 h-4 w-4" />
                                      ذخیره
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => deleteBannerItem(item.id)}
                                        disabled={bannerLoading}
                                    >
                                      <Trash2 className="ml-2 h-4 w-4" />
                                      حذف
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}