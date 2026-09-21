import React from 'react';
import { FamilyMember, NodePosition } from '@kinfolk/shared';
import { MapPin, ChevronRight, Edit2, Plus } from 'lucide-react';
import { calculateAge } from '@/lib/age/calculate-age';
import { StatusIndicator } from './StatusIndicator';
import { AgePill } from './AgePill';
import { GlassCard } from '../ui/GlassCard';

export interface MemberNodeCardProps {
  member: FamilyMember;
  position: NodePosition;
  isSpotlighted: boolean;
  isAdmin: boolean;
  isFiltered: boolean;
  onSpotlight: (id: string) => void;
  onEdit: (id: string) => void;
  onAddChild: (id: string) => void;
}

export function MemberNodeCard({
  member,
  position,
  isSpotlighted,
  isAdmin,
  isFiltered,
  onSpotlight,
  onEdit,
  onAddChild,
}: MemberNodeCardProps) {
  const isDeceased = !!member.dateOfDeath;
  const ageInfo = calculateAge(member.dateOfBirth, member.dateOfDeath, isDeceased);

  return (
    <GlassCard
      className={`tree-card absolute rounded-2xl border transition-all duration-300 ease-in-out cursor-pointer group shadow-md hover:shadow-xl border-zinc-200/90 dark:border-zinc-800 hover:border-heritage-gold/60 dark:hover:border-heritage-gold/60 ${
        isSpotlighted ? 'ring-2 ring-heritage-gold scale-105 is-spotlighted z-10' : ''
      } ${
        isFiltered ? 'opacity-20 scale-95 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
      }}
      onClick={() => onSpotlight(member.id)}
    >
      {/* Admin tools */}
      {isAdmin && (
        <div className="absolute -top-3.5 right-2 flex items-center space-x-1 bg-zinc-800 rounded-full px-2 py-1 shadow-lg border border-zinc-700/50 z-20" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(member.id)}
            className="p-1 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-700"
            title="Edit member"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onAddChild(member.id)}
            className="p-1 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-700"
            title="Add child"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.firstName}
                className={`w-12 h-12 rounded-xl object-cover ${
                  isDeceased ? 'grayscale ring-2 ring-zinc-400/50' : 'ring-2 ring-heritage-gold/60'
                }`}
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-serif font-bold text-sm select-none ${
                  isDeceased
                    ? 'bg-zinc-800 text-zinc-400 ring-2 ring-zinc-600/50'
                    : 'bg-gradient-to-br from-amber-500/20 to-amber-900/30 text-heritage-gold ring-2 ring-heritage-gold/50'
                }`}
              >
                {member.firstName?.[0]?.toUpperCase() || ''}
                {member.lastName?.[0]?.toUpperCase() || ''}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1">
              <StatusIndicator isDeceased={isDeceased} />
            </div>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {member.generation !== undefined && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 whitespace-nowrap">
                  Gen {member.generation}
                </span>
              )}
              <AgePill ageInfo={ageInfo} />
            </div>
            <h3 className="text-base font-serif font-bold text-zinc-100 truncate">
              {member.firstName} {member.lastName}
            </h3>
            {member.profession && (
              <p className="text-xs text-zinc-400 truncate mt-0.5">{member.profession}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-800/50">
          <div className="flex items-center text-xs text-zinc-400 max-w-[70%]">
            <MapPin className="w-3 h-3 mr-1 shrink-0" />
            <span className="truncate">{member.residence || 'Unknown location'}</span>
          </div>
          <div className="flex items-center text-xs font-medium text-heritage-gold opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
