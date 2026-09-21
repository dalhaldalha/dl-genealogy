import React from 'react';
import { FamilyMember } from '@kinfolk/shared';
import { MapPin, Briefcase } from 'lucide-react';

export interface ProfileHeroProps {
  member: FamilyMember;
}

export function ProfileHero({ member }: ProfileHeroProps) {
  const isDeceased = !!member.dateOfDeath;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-5">
        <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-zinc-800 shadow-xl bg-zinc-800 flex items-center justify-center">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.firstName}
              className={`w-full h-full object-cover ${isDeceased ? 'grayscale' : ''}`}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center font-serif font-bold text-2xl select-none ${
              isDeceased
                ? 'bg-zinc-800 text-zinc-400'
                : 'bg-gradient-to-br from-amber-500/20 to-amber-900/40 text-heritage-gold'
            }`}>
              {member.firstName?.[0]?.toUpperCase() || ''}
              {member.lastName?.[0]?.toUpperCase() || ''}
            </div>
          )}
        </div>
        {isDeceased && (
          <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-md text-[10px] font-medium shadow-md flex items-center gap-1">
            <span>The Late</span>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-serif font-bold text-zinc-50 mb-1">
        {member.firstName} {member.lastName}
      </h2>
      
      {member.maidenName && (
        <p className="text-sm font-medium text-zinc-400 mb-3 italic">
          née {member.maidenName}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
        {member.profession && (
          <div className="flex items-center gap-1.5 text-sm text-zinc-300">
            <Briefcase className="w-4 h-4 text-zinc-500" />
            <span>{member.profession}</span>
          </div>
        )}
        
        {member.residence && (
          <div className="flex items-center gap-1.5 text-sm text-zinc-300">
            <MapPin className="w-4 h-4 text-zinc-500" />
            <span>{member.residence}</span>
          </div>
        )}
      </div>
    </div>
  );
}
