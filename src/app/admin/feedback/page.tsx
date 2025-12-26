'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

type FeedbackStatus = 'NEW' | 'READ' | 'DONE';

type FeedbackItem = {
  id: string;
  name: string | null;
  mobile: string | null;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
};

export default function AdminFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [activeTab, setActiveTab] = useState<FeedbackStatus | 'ALL'>('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchItems = async (status: FeedbackStatus | 'ALL') => {
    setLoading(true);
    setError('');
    try {
      const query = status === 'ALL' ? '' : `?status=${encodeURIComponent(status)}`;
      const res = await fetch(`/api/admin/feedback${query}`);
      const json = (await res.json().catch(() => ({}))) as any;

      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!res.ok || !json?.success) {
        setError(json?.message || 'خطا در دریافت پیام‌ها');
        return;
      }

      setItems((json.items || []) as FeedbackItem[]);
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = (await res.json().catch(() => ({}))) as any;

      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!res.ok || !json?.success) {
        setError(json?.message || 'خطا در بروزرسانی');
        return;
      }

      setItems((cur) => cur.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setActionLoading(false);
    }
  };

  const counts = useMemo(() => {
    const c = { NEW: 0, READ: 0, DONE: 0 };
    for (const x of items) c[x.status]++;
    return c;
  }, [items]);

  const StatusBadge = ({ status }: { status: FeedbackStatus }) => {
    if (status === 'NEW') return <Badge className="bg-blue-500 hover:bg-blue-600">جدید</Badge>;
    if (status === 'READ') return <Badge variant="secondary">خوانده شده</Badge>;
    return <Badge className="bg-green-600 hover:bg-green-700">انجام شد</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">نظرات و پیشنهادات</h1>
        <p className="text-sm text-muted-foreground mt-1">مدیریت پیام‌های کاربران و پیگیری وضعیت رسیدگی</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>پیام‌ها</CardTitle>
          <CardDescription>برای مرتب‌سازی، از تب‌ها استفاده کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ALL">همه</TabsTrigger>
              <TabsTrigger value="NEW">جدید ({counts.NEW.toLocaleString('fa-IR')})</TabsTrigger>
              <TabsTrigger value="READ">خوانده شده ({counts.READ.toLocaleString('fa-IR')})</TabsTrigger>
              <TabsTrigger value="DONE">انجام شد ({counts.DONE.toLocaleString('fa-IR')})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">پیامی برای نمایش وجود ندارد.</div>
              ) : (
                <div className="grid gap-4">
                  {items.map((x) => (
                    <Card key={x.id} className="bg-muted/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={x.status} />
                              <span className="text-xs text-muted-foreground">{new Date(x.createdAt).toLocaleString('fa-IR')}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">نام:</span> {x.name || '—'}
                              <span className="mx-2 text-muted-foreground">|</span>
                              <span className="font-medium">موبایل:</span> {x.mobile || '—'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading || x.status === 'READ'}
                              onClick={() => updateStatus(x.id, 'READ')}
                            >
                              علامت خوانده‌شده
                            </Button>
                            <Button
                              size="sm"
                              disabled={actionLoading || x.status === 'DONE'}
                              onClick={() => updateStatus(x.id, 'DONE')}
                            >
                              انجام شد
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm leading-7">{x.message}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
