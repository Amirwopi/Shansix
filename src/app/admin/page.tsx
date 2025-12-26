'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  PlusCircle
} from 'lucide-react';

interface AdminData {
  rounds: Array<{ id: string; number: number; status: string; startedAt: string; closedAt?: string | null; drawDate?: string | null; capacity: number; entryPrice: number; winnersCount: number; }>;
  selectedRound: { id: string; number: number; status: string; startedAt: string; closedAt?: string | null; drawDate?: string | null; capacity: number; entryPrice: number; winnersCount: number; } | null;
  users: Array<{ id: string; mobile: string; isActive: boolean; successfulPurchases: number; createdAt: string; }>;
  payments: Array<{ id: string; userId: string; roundId: string; amount: number; status: string; refId?: string; createdAt: string; userMobile?: string; user?: { mobile?: string } }>; 
  lotteryCodes: Array<{ id: string; code: string; userId: string; roundId: string; userMobile?: string; user?: { mobile?: string }; createdAt: string; }>;
  winners: Array<{ id: string; userId: string; roundId: string; userMobile?: string; user?: { mobile?: string }; lotteryCode: string; drawDate: string; prizeAmount: number; }>;
  settings: { capacity: number; entryPrice: number; winnersCount: number; status: string; drawDate?: string; };
}

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
  });

  useEffect(() => {
    fetchAdminData(selectedRoundId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoundId]);

  const fetchAdminData = async (roundId: string) => {
    setLoading(true);
    setError('');
    try {
      const query = roundId ? `?roundId=${encodeURIComponent(roundId)}` : '';
      const response = await fetch(`/api/admin${query}`);
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
    if (!confirm('آیا مطمئن هستید که می‌خواهید قرعه‌کشی را انجام دهید؟ این عملیات غیرقابل بازگشت است.')) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/run-lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId: selectedRoundId }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`قرعه‌کشی با موفقیت انجام شد! ${result.winners.length} برنده انتخاب شدند.`);
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
      const response = await fetch('/api/admin/reset', { method: 'POST' });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity, entryPrice, winnersCount, status }),
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

  const filteredData = useMemo(() => {
    if (!data) return { users: [], payments: [], lotteryCodes: [] };
    const lowercasedFilter = searchTerm.toLowerCase();
    const getMobileFromPayment = (p: AdminData['payments'][number]) =>
      (p.user?.mobile ?? p.userMobile ?? '').toString();
    const getMobileFromCode = (c: AdminData['lotteryCodes'][number]) =>
      (c.user?.mobile ?? c.userMobile ?? '').toString();
    return {
      users: data.users.filter(u => u.mobile.includes(lowercasedFilter)),
      payments: data.payments.filter(p => getMobileFromPayment(p).includes(lowercasedFilter)),
      lotteryCodes: data.lotteryCodes.filter(c => getMobileFromCode(c).includes(lowercasedFilter) || c.code.toLowerCase().includes(lowercasedFilter)),
    };
  }, [data, searchTerm]);

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
          <Button onClick={() => fetchAdminData(selectedRoundId)} className="mt-4">تلاش مجدد</Button>
        </Alert>
    );
  }

  if (!data) {
    return <p>اطلاعاتی برای نمایش وجود ندارد.</p>;
  }

  const totalRevenue = data.payments.filter(p => p.status === 'SUCCESS').reduce((acc, p) => acc + p.amount, 0);
  const canRunLottery =
    !actionLoading &&
    !!data.selectedRound?.status &&
    (data.selectedRound.status === 'OPEN' || data.selectedRound.status === 'CLOSED') &&
    data.lotteryCodes.length > 0;

  return (
      <div className="flex flex-col gap-6">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-semibold">مدیریت قرعه کشی</h1>
          <div className="flex items-center gap-2">
            <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="انتخاب دوره" />
              </SelectTrigger>
              <SelectContent>
                {data.rounds.map(r => <SelectItem key={r.id} value={r.id}>دوره #{r.number}</SelectItem>)}
              </SelectContent>
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
              <div className="text-2xl font-bold">{data.lotteryCodes.length.toLocaleString('fa-IR')} / {data.settings.capacity.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">نفر در این دوره</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">وضعیت دوره</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"><StatusBadge status={data.selectedRound?.status ?? ''} /></div>
              <p className="text-xs text-muted-foreground">وضعیت فعلی دوره انتخاب شده</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">برندگان</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.winners.length.toLocaleString('fa-IR')} / {data.settings.winnersCount.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">نفر از تعداد مورد نیاز</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>عملیات مدیریتی</CardTitle>
            <CardDescription>ابزارهای اصلی برای مدیریت دوره فعلی قرعه کشی.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={handleRunLottery} disabled={!canRunLottery}>
              <Play className="ml-2 h-4 w-4" />
              انجام قرعه کشی
            </Button>
            <Button variant="outline" onClick={handleUpdateSettings}><Settings className="ml-2 h-4 w-4" />تنظیمات</Button>
            <Button variant="secondary" onClick={handleExportExcel}><FileUp className="ml-2 h-4 w-4" />خروجی اکسل</Button>
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
                  onValueChange={(v) =>
                    setSettingsForm((s) => ({ ...s, status: v as 'OPEN' | 'CLOSED' | 'DRAWN' }))
                  }
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">کاربران</TabsTrigger>
            <TabsTrigger value="payments">پرداخت ها</TabsTrigger>
            <TabsTrigger value="codes">کدها</TabsTrigger>
            <TabsTrigger value="winners">برندگان</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>لیست کاربران</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="جستجو بر اساس شماره موبایل..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>شماره موبایل</TableHead><TableHead>وضعیت</TableHead><TableHead>تعداد خرید</TableHead><TableHead>تاریخ عضویت</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredData.users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono">{user.mobile}</TableCell>
                          <TableCell>{user.isActive ? <Badge variant="default" className="bg-green-500 hover:bg-green-600">فعال</Badge> : <Badge variant="secondary">غیرفعال</Badge>}</TableCell>
                          <TableCell>{user.successfulPurchases.toLocaleString('fa-IR')}</TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString('fa-IR')}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments">
            <Card>
              <CardHeader><CardTitle>تاریخچه پرداخت ها</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>موبایل</TableHead><TableHead>مبلغ</TableHead><TableHead>وضعیت</TableHead><TableHead>تاریخ</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredData.payments.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{p.user?.mobile ?? p.userMobile ?? '-'}</TableCell>
                          <TableCell>{p.amount.toLocaleString('fa-IR')} تومان</TableCell>
                          <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                          <TableCell>{new Date(p.createdAt).toLocaleString('fa-IR')}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="codes">
            <Card>
              <CardHeader><CardTitle>کدهای صادر شده</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>کد</TableHead><TableHead>موبایل</TableHead><TableHead>تاریخ صدور</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredData.lotteryCodes.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono tracking-widest">{c.code}</TableCell>
                          <TableCell>{c.user?.mobile ?? c.userMobile ?? '-'}</TableCell>
                          <TableCell>{new Date(c.createdAt).toLocaleDateString('fa-IR')}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="winners">
            <Card>
              <CardHeader><CardTitle>لیست برندگان</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>موبایل</TableHead><TableHead>کد برنده</TableHead><TableHead>مبلغ جایزه</TableHead><TableHead>تاریخ</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.winners.map(w => (
                        <TableRow key={w.id}>
                          <TableCell>{w.user?.mobile ?? w.userMobile ?? '-'}</TableCell>
                          <TableCell className="font-mono tracking-widest">{w.lotteryCode}</TableCell>
                          <TableCell>{w.prizeAmount.toLocaleString('fa-IR')} تومان</TableCell>
                          <TableCell>{new Date(w.drawDate).toLocaleDateString('fa-IR')}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}