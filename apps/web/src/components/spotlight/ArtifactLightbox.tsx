import React, { useState, useEffect, useCallback } from 'react';
import { MediaArtifact } from '@kinfolk/shared';
import { X, ChevronLeft, ChevronRight, FileText, Mail, Award, Camera } from 'lucide-react';

export interface ArtifactLightboxProps {
  artifacts: MediaArtifact[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtifactLightbox({ artifacts, initialIndex, isOpen, onClose }: ArtifactLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : artifacts.length - 1));
  }, [artifacts.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < artifacts.length - 1 ? prev + 1 : 0));
  }, [artifacts.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrevious, handleNext]);

  if (!isOpen || artifacts.length === 0) return null;

  const artifact = artifacts[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'letter': return <Mail className="w-4 h-4" />;
      case 'certificate': return <Award className="w-4 h-4" />;
      default: return <Camera className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/95 backdrop-blur-xl">
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-all z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {artifacts.length > 1 && (
        <>
          <button 
            onClick={handlePrevious} 
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-all z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={handleNext} 
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-all z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      <div className="relative flex flex-col items-center justify-center w-full max-w-5xl h-full p-8 sm:p-12">
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <span className="text-zinc-400 font-medium text-sm">
            {currentIndex + 1} / {artifacts.length}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 rounded-lg text-xs font-medium text-heritage-gold uppercase tracking-wider">
            {getIcon(artifact.artifactType || 'photo')}
            {artifact.artifactType || 'photo'}
          </div>
        </div>

        <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
          <img 
            src={artifact.url} 
            alt={artifact.caption || 'Artifact'} 
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
          />
        </div>

        {artifact.caption && (
          <div className="mt-6 text-center max-w-2xl">
            <p className="font-serif text-lg md:text-xl text-heritage-gold leading-relaxed">
              {artifact.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
