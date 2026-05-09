import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Bell, Maximize, Minimize, ChevronUp, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNotification } from '../contexts/AuthContext';

type TimerState = 'idle' | 'running' | 'paused' | 'warning' | 'completed';

export function Timer() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [state, setState] = useState<TimerState>('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);
  const { showNotification } = useNotification();

  const BELL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';

  useEffect(() => {
    audioRef.current = new Audio(BELL_SOUND_URL);
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
    };
  }, []);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err: any) {
        console.error(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const unlockAudio = () => {
    if (!isAudioUnlocked && audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
        setIsAudioUnlocked(true);
      }).catch(e => console.error("Audio unlock failed", e));
    }
  };

  const playBell = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Bell play failed", e));
    }
  }, []);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const startTimer = () => {
    unlockAudio();
    requestWakeLock();
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0 && state === 'idle') {
      showNotification('Please set a time first!', 'info');
      return;
    }

    if (state === 'idle') {
      setTimeLeft(totalSeconds);
      setInitialTime(totalSeconds);
    }
    
    setState('running');
  };

  const pauseTimer = () => {
    setState('paused');
    releaseWakeLock();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetTimer = () => {
    setState('idle');
    setTimeLeft(initialTime);
    releaseWakeLock();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        showNotification(`Error attempting to enable full-screen mode: ${err.message}`, 'error');
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (state === 'running' || state === 'warning') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setState('completed');
            playBell();
            triggerConfetti();
            releaseWakeLock();
            return 0;
          }
          
          const nextTime = prev - 1;
          if (nextTime <= 60 && state !== 'warning') {
            setState('warning');
          }
          return nextTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, playBell]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getBgColor = () => {
    switch (state) {
      case 'running': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'completed': return 'bg-red-600 animate-pulse';
      case 'paused': return 'bg-blue-400';
      default: return 'bg-blue-600';
    }
  };

  const setPreset = (mins: number) => {
    setHours(0);
    setMinutes(mins);
    setSeconds(0);
    setState('idle');
    setTimeLeft(mins * 60);
  };

  const adjustTime = (type: 'h' | 'm' | 's', amount: number) => {
    if (state !== 'idle') return;
    if (type === 'h') setHours(prev => Math.max(0, prev + amount));
    if (type === 'm') setMinutes(prev => Math.max(0, Math.min(59, prev + amount)));
    if (type === 's') setSeconds(prev => Math.max(0, Math.min(59, prev + amount)));
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen flex flex-col transition-colors duration-500 ${getBgColor()} text-white p-4 sm:p-8`}
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight drop-shadow-md">EventBell Timer ⏱️</h1>
        <button 
          onClick={toggleFullscreen}
          className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        <div className="text-center">
          <div className={`font-mono font-bold tabular-nums drop-shadow-2xl ${isFullscreen ? 'text-[20vw]' : 'text-7xl sm:text-9xl'}`}>
            {state === 'idle' ? formatTime(hours * 3600 + minutes * 60 + seconds) : formatTime(timeLeft)}
          </div>
          {state === 'completed' && (
            <div className="text-4xl sm:text-6xl font-black uppercase tracking-widest mt-4 animate-bounce">
              Time's Up! 🔔
            </div>
          )}
        </div>

        <div className="w-full max-w-2xl space-y-8">
          {state === 'idle' && (
            <div className="grid grid-cols-3 gap-4">
              {(['h', 'm', 's'] as const).map((type) => (
                <div key={type} className="flex flex-col items-center space-y-2">
                  <button onClick={() => adjustTime(type, 1)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><ChevronUp size={32} /></button>
                  <div className="text-3xl font-bold bg-white/10 w-full py-4 rounded-xl text-center backdrop-blur-sm border border-white/20">
                    {type === 'h' ? hours : type === 'm' ? minutes : seconds}
                    <span className="text-xs block opacity-60 uppercase">{type === 'h' ? 'Hrs' : type === 'm' ? 'Min' : 'Sec'}</span>
                  </div>
                  <button onClick={() => adjustTime(type, -1)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><ChevronDown size={32} /></button>
                </div>
              ))}
            </div>
          )}

          {state === 'idle' && (
            <div className="flex flex-wrap justify-center gap-2">
              {[1, 5, 10, 15, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setPreset(m)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/30 rounded-full text-sm font-bold transition-all border border-white/20"
                >
                  {m}m
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-center items-center gap-6">
            <button
              onClick={resetTimer}
              className="p-6 bg-white/20 hover:bg-white/30 rounded-full transition-all shadow-lg border border-white/20"
              title="Reset"
            >
              <RotateCcw size={32} />
            </button>

            {state === 'running' || state === 'warning' ? (
              <button
                onClick={pauseTimer}
                className="p-10 bg-white text-blue-600 hover:scale-105 rounded-full transition-all shadow-2xl"
                title="Pause"
              >
                <Pause size={48} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="p-10 bg-white text-green-600 hover:scale-105 rounded-full transition-all shadow-2xl"
                title="Start"
              >
                <Play size={48} fill="currentColor" className="ml-2" />
              </button>
            )}

            <button
              onClick={playBell}
              className="p-6 bg-white/20 hover:bg-white/30 rounded-full transition-all shadow-lg border border-white/20"
              title="Manual Bell"
            >
              <Bell size={32} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-white/60 text-sm font-medium uppercase tracking-widest">
        {state === 'idle' ? 'Set time and press play' : state === 'running' ? 'Timer active' : state === 'paused' ? 'Timer paused' : state === 'warning' ? 'Final minute!' : 'Session complete'}
      </div>
    </div>
  );
}