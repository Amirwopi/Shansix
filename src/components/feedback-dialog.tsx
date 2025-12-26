'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function FeedbackDialog({ triggerText = 'نظرات و پیشنهادات' }: { triggerText?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    message: '',
  });

  const onSubmit = async () => {
    setError('');
    setSuccess('');

    const message = form.message.trim();
    if (message.length < 5) {
      setError('متن پیام خیلی کوتاه است.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim() || null,
          mobile: form.mobile.trim() || null,
          message,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as any;

      if (!res.ok || !json?.success) {
        setError(json?.message || 'خطا در ارسال پیام');
        return;
      }

      setSuccess('پیام شما با موفقیت ثبت شد.');
      setForm({ name: '', mobile: '', message: '' });
      setTimeout(() => setOpen(false), 800);
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) {
        setError('');
        setSuccess('');
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>نظرات و پیشنهادات</DialogTitle>
          <DialogDescription>
            پیام شما مستقیماً برای تیم پشتیبانی ارسال و در پنل ادمین قابل بررسی خواهد بود.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            {success}
          </div>
        ) : null}

        <div className="grid gap-3">
          <div className="grid gap-2">
            <div className="text-sm font-medium">نام (اختیاری)</div>
            <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="مثلاً امیر" />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">شماره موبایل (اختیاری)</div>
            <Input
              inputMode="numeric"
              value={form.mobile}
              onChange={(e) => setForm((s) => ({ ...s, mobile: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
              placeholder="09123456789"
              className="text-left dir-ltr"
            />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">پیام شما</div>
            <Textarea value={form.message} onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))} placeholder="نظر، پیشنهاد یا مشکل خود را بنویسید..." />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            بستن
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? 'در حال ارسال...' : 'ارسال'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
