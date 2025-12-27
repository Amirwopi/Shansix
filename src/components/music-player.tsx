'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

const STORAGE_KEY = 'site_music_v1';

export function MusicPlayer({ src = '/music/background.mp3' }: { src?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const [fallbackMode, setFallbackMode] = useState<'media' | 'tone'>('media');

  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setEnabled(true);
        setVolume(0.35);
        return;
      }
      const parsed = JSON.parse(raw) as any;
      setEnabled(Boolean(parsed?.enabled));
      setVolume(clamp01(Number(parsed?.volume ?? 0.35)));
    } catch {
      setEnabled(true);
      setVolume(0.35);
    }
  }, []);

  const stopTone = () => {
    try {
      oscRef.current?.stop();
    } catch {
    }
    oscRef.current = null;
    gainRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
  };

  const startTone = async () => {
    if (typeof window === 'undefined') return;
    stopTone();

    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctx) return;

    const ctx = new Ctx();
    audioCtxRef.current = ctx;

    const gain = ctx.createGain();
    gain.gain.value = volume * 0.8;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 196;
    osc.connect(gain);
    osc.start();
    oscRef.current = osc;

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch {
    }
  };

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, volume }));
    } catch {
    }
  }, [enabled, mounted, volume]);

  useEffect(() => {
    if (!mounted) return;
    const a = audioRef.current;
    if (!a) return;

    a.volume = volume;

    if (gainRef.current) {
      gainRef.current.gain.value = volume * 0.8;
    }

    const startOrStop = async () => {
      if (!enabled) {
        a.pause();
        stopTone();
        return;
      }
      try {
        if (fallbackMode === 'tone') {
          await startTone();
          return;
        }

        stopTone();
        await a.play();
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          return;
        }
        setFallbackMode('tone');
        await startTone();
      }
    };

    startOrStop();
  }, [enabled, mounted, volume, fallbackMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const a = audioRef.current;
    if (!a) return;
    if (!enabled) return;
    if (fallbackMode !== 'media') return;

    const attempt = async () => {
      try {
        await a.play();
      } catch {
      }
    };

    const handler = () => {
      attempt().catch(() => undefined);
    };

    window.addEventListener('pointerdown', handler, { passive: true });
    window.addEventListener('keydown', handler);
    window.addEventListener('touchstart', handler, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, [enabled, fallbackMode]);

  useEffect(() => {
    return () => {
      stopTone();
    };
  }, []);

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border bg-background/70 px-3 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="metadata"
        onCanPlay={() => {
          setReady(true);
          setFallbackMode('media');
        }}
        onError={() => {
          setFallbackMode('tone');
          setReady(true);
        }}
      />

      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          const a = audioRef.current;
          if (a) {
            try {
              a.load();
            } catch {
            }
          }
          setEnabled((v) => !v);
        }}
        aria-label={mounted && enabled ? 'توقف موزیک' : 'پخش موزیک'}
      >
        {mounted && enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => setVolume((v) => (v > 0 ? 0 : 0.35))}
        aria-label={volume > 0 ? 'بی‌صدا' : 'صدا'}
      >
        {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </Button>

      <input
        aria-label="تنظیم صدا"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(clamp01(Number(e.target.value)))}
        className="w-24"
      />
    </div>
  );
}
