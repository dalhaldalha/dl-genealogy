import React from 'react';
import { FamilyMember, ParentChild, Union } from '@kinfolk/shared';
import { X, Heart, Crosshair, Image as ImageIcon, Edit3 } from 'lucide-react';
import { ProfileHero } from './ProfileHero';
import { VitalStatsGrid } from './VitalStatsGrid';
import { BiographySection } from './BiographySection';
import { RelationshipPills } from './RelationshipPills';
import { ArtifactGallery } from './ArtifactGallery';

export interface SpotlightDrawerProps {
  member: FamilyMember | null;
  isOpen: boolean;
  isAdmin: boolean;
  allMembers: FamilyMember[];
  parentChildEdges: ParentChild[];
  unions: Union[];
  onClose: () => void;
  onSpotlight: (id: string) => void;
  onEdit: (id: string) => void;
  onRecenter?: (id: string) => void;
}

export function SpotlightDrawer({
  member,
  isOpen,
  isAdmin,
  allMembers,
  parentChildEdges,
  unions,
  onClose,
  onSpotlight,
  onEdit,
  onRecenter,
}: SpotlightDrawerProps) {
  return (
    <aside
      className={`fixed top-0 right-0 h-full w-full max-w-lg bg-zinc-900/95 backdrop-blur-2xl border-l border-zinc-700/50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {member ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800/50 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              {member.generation !== undefined && (
                <span className="px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 text-heritage-gold border border-heritage-gold/20">
                  Generation {member.generation}
                </span>
              )}
              <span className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded-lg border ${
                member.dateOfDeath 
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                  : 'bg-emerald-900/20 text-emerald-400 border-emerald-800/30'
              }`}>
                {member.dateOfDeath ? 'Deceased' : 'Living'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isAdmin && (
                <button
                  onClick={() => onEdit(member.id)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-800"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-800 bg-zinc-800/50"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
            {/* Sections */}
            <ProfileHero member={member} />
            <VitalStatsGrid member={member} />
            <BiographySection bio={member.bio || ''} />
            
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Heart className="w-4 h-4 text-heritage-gold" />
                Family Relations
              </h4>
              <RelationshipPills 
                member={member}
                allMembers={allMembers}
                parentChildEdges={parentChildEdges}
                unions={unions}
                onSpotlight={onSpotlight}
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-heritage-gold" />
                Archive Gallery
              </h4>
              <ArtifactGallery artifacts={[]} />
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-3 sm:p-4 pb-6 sm:pb-4 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
            <button
              className="flex items-center gap-1.5 text-xs text-heritage-gold hover:underline font-semibold transition-all"
              onClick={() => onRecenter?.(member.id)}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Re-center Canvas</span>
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all text-zinc-800 dark:text-zinc-200"
              onClick={onClose}
            >
              Close Inspector
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-500">
          No member selected
        </div>
      )}
    </aside>
  );
}
