'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { MusicPlayer } from '@/components/music-player';
import { SiteFooter } from '@/components/site-footer';
import { GoftinoWidget } from '@/components/goftino-widget';

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isAdminArea = useMemo(() => {
    if (!pathname) return false;
    return pathname === '/admin' || pathname.startsWith('/admin/');
  }, [pathname]);

  if (isAdminArea) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-aurora">
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <MusicPlayer src="/music.mp3" />
      <GoftinoWidget />
    </div>
  );
}
