import React, { useState } from 'react';
import { MediaArtifact } from '@kinfolk/shared';
import { Image as ImageIcon, FileText, Mail, Award, Camera } from 'lucide-react';
import { ArtifactLightbox } from './ArtifactLightbox';

export interface ArtifactGalleryProps {
  artifacts?: MediaArtifact[];
}

export function ArtifactGallery({ artifacts = [] }: ArtifactGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (artifacts.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="aspect-square rounded-xl bg-zinc-800/30 border border-zinc-800/50 flex flex-col items-center justify-center text-zinc-600 gap-2">
            <ImageIcon className="w-6 h-6 opacity-30" />
            {i === 2 && <span className="text-[10px] font-medium opacity-50 px-2 text-center leading-tight">No keepsakes yet</span>}
          </div>
        ))}
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-3.5 h-3.5" />;
      case 'letter': return <Mail className="w-3.5 h-3.5" />;
      case 'certificate': return <Award className="w-3.5 h-3.5" />;
      default: return <Camera className="w-3.5 h-3.5" />;
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {artifacts.map((artifact, i) => (
          <div 
            key={artifact.id}
            onClick={() => setLightboxIndex(i)}
            className="aspect-square rounded-xl overflow-hidden bg-zinc-800 relative group cursor-pointer border border-zinc-700/50 hover:border-heritage-gold/50 transition-colors"
          >
            <img 
              src={artifact.url} 
              alt={artifact.caption || ''} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 backdrop-blur-md rounded-lg text-heritage-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {getIcon(artifact.artifactType || 'photo')}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
              <span className="text-[10px] font-medium text-white truncate w-full text-center">
                {artifact.caption}
              </span>
            </div>
          </div>
        ))}
      </div>

      <ArtifactLightbox
        artifacts={artifacts}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
}
