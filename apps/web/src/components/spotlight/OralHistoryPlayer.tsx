import React, { useRef, useState, useEffect } from 'react';
import { MediaArtifact } from '@kinfolk/shared';
import { Play, Pause, Volume2 } from 'lucide-react';

export interface OralHistoryPlayerProps {
  artifacts: MediaArtifact[];
}

export function OralHistoryPlayer({ artifacts }: OralHistoryPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const artifact = artifacts[currentIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (!artifact) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg relative overflow-hidden">
      {/* Subtle background element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-heritage-gold/5 rounded-full blur-3xl pointer-events-none" />
      
      <audio ref={audioRef} src={artifact.url} preload="metadata" />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <h5 className="font-serif text-zinc-100 font-semibold truncate text-sm sm:text-base mb-1">
            {artifact.caption || 'Oral History Recording'}
          </h5>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 uppercase tracking-wider font-medium">
            <Volume2 className="w-3.5 h-3.5 text-heritage-gold" />
            Voice Note
          </div>
        </div>
        <button
          onClick={togglePlay}
          className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-heritage-gold to-amber-600 flex items-center justify-center text-zinc-950 shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          )}
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        {/* Custom Range Slider for Progress */}
        <div className="relative flex items-center h-4 group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-heritage-gold relative"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>

      {artifacts.length > 1 && (
        <div className="pt-3 mt-1 border-t border-zinc-800/50 flex flex-col gap-2">
          {artifacts.map((a, idx) => (
            <button
              key={a.id}
              onClick={() => {
                setCurrentIndex(idx);
                setIsPlaying(false);
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                }
              }}
              className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors truncate ${
                idx === currentIndex 
                  ? 'bg-zinc-800/80 text-heritage-gold font-medium border border-zinc-700/50' 
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {idx + 1}. {a.caption || 'Recording ' + (idx + 1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
