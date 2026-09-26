import React from 'react';
import { FamilyMember } from '@kinfolk/shared';
import { Calendar, GitBranch } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { calculateAge } from '@/lib/age/calculate-age';

export interface VitalStatsGridProps {
  member: FamilyMember;
}

export function VitalStatsGrid({ member }: VitalStatsGridProps) {
  const isDeceased = !!member.dateOfDeath || !!member.rawDeathDate;
  const ageInfo = calculateAge(member.dateOfBirth, member.dateOfDeath, isDeceased, member.rawBirthDate, member.rawDeathDate);

  return (
    <div className="grid grid-cols-2 gap-4">
      <GlassPanel className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-zinc-400 mb-1">
          <Calendar className="w-4 h-4 text-heritage-gold" />
          <span className="text-xs font-semibold uppercase tracking-wider">Lifespan</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-col text-sm">
            <span className="text-zinc-200 font-medium">{ageInfo.text}</span>
            {ageInfo.sub && <span className="text-zinc-500">{ageInfo.sub}</span>}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-zinc-400 mb-1">
          <GitBranch className="w-4 h-4 text-heritage-gold" />
          <span className="text-xs font-semibold uppercase tracking-wider">Heritage</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-col text-sm">
            <span className="text-zinc-500 mb-1">Lineage</span>
            <span className="text-zinc-200 font-medium">
              {member.lastName} Branch
            </span>
          </div>
          {member.generation !== undefined && (
            <div className="flex justify-between items-center text-sm border-t border-zinc-800/50 pt-1.5 mt-1.5">
              <span className="text-zinc-500">Generation</span>
              <span className="text-zinc-200 font-medium">{member.generation}</span>
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
