import Link from 'next/link';

import { FeedbackDialog } from '@/components/feedback-dialog';

export function SiteFooter() {
  return (
    <footer className="border-t bg-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/20">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold">کپی‌رایت</div>
            <div className="text-sm text-muted-foreground">© 1405-1406 — تمامی حقوق این سامانه محفوظ است.</div>
            <div className="text-xs text-muted-foreground">
              توسعه‌دهنده:{' '}
              <a
                href="https://github.com/Amirwopi"
                target="_blank"
                rel="noreferrer"
                className="text-foreground/90 hover:text-foreground underline underline-offset-4"
              >
                Amirwopi
              </a>
              <span className="mx-2 text-muted-foreground/60">|</span>
              <a
                href="https://github.com/amirwopi"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                github.com/Amirwopi
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">لینک‌ها</div>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/rules" className="text-muted-foreground hover:text-foreground transition-colors">
                قوانین و مقررات
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">ارتباط با ما</div>
            <div className="flex flex-col gap-2">
              <FeedbackDialog />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">نمادها</div>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-28 overflow-hidden rounded-md border bg-background">
                <img src="/logos/enamad.svg" alt="اینماد" className="h-full w-full object-contain p-2" />
              </div>
              <div className="relative h-10 w-28 overflow-hidden rounded-md border bg-background">
                <img src="/logos/zarinpal.svg" alt="زرین‌پال" className="h-full w-full object-contain p-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
