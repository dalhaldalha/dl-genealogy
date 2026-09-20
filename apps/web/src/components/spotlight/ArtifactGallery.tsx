import React from 'react';
import { MediaArtifact } from '@kinfolk/shared';
import { Image as ImageIcon } from 'lucide-react';

export interface ArtifactGalleryProps {
  artifacts?: MediaArtifact[];
}

export function ArtifactGallery({ artifacts = [] }: ArtifactGalleryProps) {
  if (artifacts.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="aspect-square rounded-xl bg-zinc-800/30 border border-zinc-800/50 flex flex-col items-center justify-center text-zinc-600 gap-2">
            <ImageIcon className="w-6 h-6 opacity-50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {artifacts.map((artifact) => (
        <div 
          key={artifact.id}
          className="aspect-square rounded-xl overflow-hidden bg-zinc-800 relative group cursor-pointer border border-zinc-700/50 hover:border-heritage-gold/50 transition-colors"
        >
          <img 
            src={artifact.url} 
            alt={artifact.caption || ''} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
            <span className="text-[10px] font-medium text-white truncate w-full text-center">
              {artifact.caption}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
