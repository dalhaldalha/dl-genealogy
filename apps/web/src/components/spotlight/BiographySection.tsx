import React from 'react';
import { BookOpen } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';

export interface BiographySectionProps {
  bio?: string;
}

export function BiographySection({ bio }: BiographySectionProps) {
  if (!bio) return null;

  return (
    <GlassPanel className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-4 h-4 text-heritage-gold" />
        <h4 className="text-sm font-semibold text-zinc-100">Life Story & Milestones</h4>
      </div>
      <div className="text-sm text-zinc-300 leading-relaxed space-y-3">
        {bio.split('\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </GlassPanel>
  );
}
