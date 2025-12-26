'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

  const initial = useMemo(() => {
    if (typeof window === 'undefined') return { enabled: false, volume: 0.35 };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { enabled: false, volume: 0.35 };
      const parsed = JSON.parse(raw) as any;
      return {
        enabled: Boolean(parsed?.enabled),
        volume: clamp01(Number(parsed?.volume ?? 0.35)),
      };
    } catch {
      return { enabled: false, volume: 0.35 };
    }
  }, []);

  const [enabled, setEnabled] = useState(initial.enabled);
  const [volume, setVolume] = useState(initial.volume);
  const [ready, setReady] = useState(false);

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
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, volume }));
    } catch {
    }
  }, [enabled, volume]);

  useEffect(() => {
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
      } catch {
        setFallbackMode('tone');
        await startTone();
      }
    };

    startOrStop();
  }, [enabled, volume, fallbackMode]);

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
        aria-label={enabled ? 'توقف موزیک' : 'پخش موزیک'}
      >
        {enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
