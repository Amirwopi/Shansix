'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type BannerItem = {
  id: string;
  imageUrl: string;
  topText?: string | null;
  bottomText?: string | null;
  sortOrder: number;
};

export function DashboardBanner() {
  const [items, setItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const hoveredRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/dashboard/banner', { cache: 'no-store' });
        const json = await res.json().catch(() => ({} as any));
        if (!mounted) return;

        if (!res.ok || !json?.success) {
          setError(json?.message || 'خطا در دریافت بنرها');
          setItems([]);
          return;
        }

        setItems(Array.isArray(json.items) ? json.items : []);
      } catch {
        if (!mounted) return;
        setError('خطا در ارتباط با سرور');
        setItems([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const normalized = useMemo(() => {
    return items.filter((i) => i && typeof i.imageUrl === 'string' && i.imageUrl.trim().length > 0);
  }, [items]);

  useEffect(() => {
    if (normalized.length <= 1) return;

    const id = window.setInterval(() => {
      if (hoveredRef.current) return;
      setActiveIndex((idx) => (idx + 1) % normalized.length);
    }, 6000);

    return () => window.clearInterval(id);
  }, [normalized.length]);

  useEffect(() => {
    if (activeIndex >= normalized.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, normalized.length]);

  const active = normalized[activeIndex];

  if (loading) return null;
  if (error) return null;
  if (!active) return null;

  const hasMultiple = normalized.length > 1;

  return (
    <Card
      className="overflow-hidden"
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
    >
      <CardContent className="p-0">
        <div className="relative">
          {active.topText ? (
            <div className="px-4 pt-4 text-sm md:text-base font-medium leading-relaxed">{active.topText}</div>
          ) : null}

          <div className="relative px-4 py-3">
            <div className="relative w-full overflow-hidden rounded-lg border bg-muted/20">
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9]">
                <img
                  src={active.imageUrl}
                  alt={active.topText || active.bottomText || 'banner'}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {hasMultiple ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={() => setActiveIndex((i) => (i - 1 + normalized.length) % normalized.length)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={() => setActiveIndex((i) => (i + 1) % normalized.length)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            </div>

            {hasMultiple ? (
              <div className="mt-3 flex items-center justify-center gap-2">
                {normalized.map((it, idx) => (
                  <button
                    key={it.id}
                    type="button"
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      idx === activeIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`banner-${idx + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {active.bottomText ? (
            <div className="px-4 pb-4 text-xs md:text-sm text-muted-foreground leading-relaxed">{active.bottomText}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
