'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

type TourStep = {
  id: string;
  title: string;
  description: string;
};

function getTargetRect(id: string) {
  const el = document.querySelector(`[data-tour-id="${CSS.escape(id)}"]`) as HTMLElement | null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { el, rect };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function DashboardTour({ steps }: { steps: TourStep[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [anchor, setAnchor] = useState<{ rect: DOMRect } | null>(null);

  const current = steps[index];

  useEffect(() => {
    if (!open) return;

    const update = () => {
      if (!current) return;
      const t = getTargetRect(current.id);
      if (!t) {
        setAnchor(null);
        return;
      }
      setAnchor({ rect: t.rect });
      try {
        t.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
      }
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, current]);

  const spotlight = useMemo(() => {
    if (!open || !anchor) return null;
    const r = anchor.rect;
    const pad = 10;
    const top = clamp(r.top - pad, 8, window.innerHeight - 8);
    const left = clamp(r.left - pad, 8, window.innerWidth - 8);
    const width = clamp(r.width + pad * 2, 48, window.innerWidth - left - 8);
    const height = clamp(r.height + pad * 2, 48, window.innerHeight - top - 8);
    return { top, left, width, height };
  }, [open, anchor]);

  const tooltip = useMemo(() => {
    if (!open || !anchor || !spotlight) return null;
    const r = anchor.rect;
    const preferredTop = r.bottom + 14;
    const placeBelow = preferredTop + 220 < window.innerHeight;

    const maxWidth = 380;
    const left = clamp(r.left, 12, window.innerWidth - maxWidth - 12);
    const top = placeBelow ? preferredTop : clamp(r.top - 220, 12, window.innerHeight - 240);

    return { top, left, width: maxWidth };
  }, [open, anchor, spotlight]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
      >
        <HelpCircle className="ml-2 h-4 w-4" />
        راهنما
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          {spotlight ? (
            <div
              className="absolute rounded-xl ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
              }}
            />
          ) : null}

          {tooltip && current ? (
            <div
              className="absolute w-[380px] max-w-[calc(100vw-24px)] rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/70"
              style={{ top: tooltip.top, left: tooltip.left }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{current.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">مرحله {index + 1} از {steps.length}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="بستن">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                {current.description}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                >
                  <ChevronRight className="ml-2 h-4 w-4" />
                  قبلی
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    if (index >= steps.length - 1) {
                      setOpen(false);
                      return;
                    }
                    setIndex((i) => Math.min(steps.length - 1, i + 1));
                  }}
                >
                  {index >= steps.length - 1 ? 'پایان' : 'بعدی'}
                  <ChevronLeft className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
