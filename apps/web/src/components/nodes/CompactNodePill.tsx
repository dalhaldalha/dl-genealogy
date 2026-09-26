import React from 'react';
import type { FamilyMember, NodePosition } from '@kinfolk/shared';
import { User } from 'lucide-react';

export interface CompactNodePillProps {
  member: FamilyMember;
  position: NodePosition;
  isSpotlighted: boolean;
  isFiltered: boolean;
  onSpotlight: (id: string) => void;
}

export function CompactNodePill({ member, position, isSpotlighted, isFiltered, onSpotlight }: CompactNodePillProps) {
  const isDeceased = !!member.dateOfDeath;
  
  return (
    <div
      className={`absolute flex items-center gap-1.5 px-2 py-1 rounded-full border cursor-pointer transition-all duration-200 ${
        isSpotlighted
          ? 'bg-zinc-800/95 border-heritage-gold/70 ring-1 ring-heritage-gold/40 z-10'
          : 'bg-zinc-900/90 border-zinc-700/50 hover:border-heritage-gold/40'
      } ${
        isFiltered ? 'opacity-20 pointer-events-none' : ''
      }`}
      style={{
        left: position.x,
        top: position.y,
        height: 36,
        minWidth: 120,
        maxWidth: 200,
      }}
      onClick={() => onSpotlight(member.id)}
    >
      {/* Avatar */}
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.firstName}
          className={`w-6 h-6 rounded-full object-cover shrink-0 ${isDeceased ? 'grayscale opacity-70' : ''}`}
        />
      ) : (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          isDeceased ? 'bg-zinc-700 text-zinc-500' : 'bg-zinc-800 text-heritage-gold'
        }`}>
          <User className="w-3 h-3" />
        </div>
      )}
      
      {/* Name */}
      <span className="text-[11px] font-medium text-zinc-200 truncate">
        {member.firstName} {member.lastName?.charAt(0)}.
      </span>
      
      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${
        isDeceased ? 'bg-zinc-500' : 'bg-emerald-500'
      }`} />
    </div>
  );
}
