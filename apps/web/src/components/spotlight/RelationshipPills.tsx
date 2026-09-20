import React, { useMemo } from 'react';
import { FamilyMember, ParentChild, Union } from '@kinfolk/shared';
import { User, Users, Baby } from 'lucide-react';

export interface RelationshipPillsProps {
  member: FamilyMember;
  allMembers: FamilyMember[];
  parentChildEdges: ParentChild[];
  unions: Union[];
  onSpotlight: (id: string) => void;
}

export function RelationshipPills({
  member,
  allMembers,
  parentChildEdges,
  unions,
  onSpotlight
}: RelationshipPillsProps) {
  const parents = useMemo(() => {
    const parentIds = parentChildEdges
      .filter(edge => edge.childId === member.id)
      .map(edge => edge.parentId);
    return allMembers.filter(m => parentIds.includes(m.id));
  }, [member.id, parentChildEdges, allMembers]);

  const spouses = useMemo(() => {
    const unionEdges = unions.filter(u => u.partner1Id === member.id || u.partner2Id === member.id);
    const spouseIds = unionEdges.map(u => u.partner1Id === member.id ? u.partner2Id : u.partner1Id);
    return allMembers.filter(m => spouseIds.includes(m.id));
  }, [member.id, unions, allMembers]);

  const children = useMemo(() => {
    const childIds = parentChildEdges
      .filter(edge => edge.parentId === member.id)
      .map(edge => edge.childId);
    return allMembers.filter(m => childIds.includes(m.id));
  }, [member.id, parentChildEdges, allMembers]);

  const renderPill = (relatedMember: FamilyMember) => (
    <button
      key={relatedMember.id}
      onClick={() => onSpotlight(relatedMember.id)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:bg-zinc-700 hover:border-zinc-600 transition-colors group"
    >
      <img 
        src={relatedMember.avatarUrl || '/placeholder-avatar.jpg'} 
        alt={relatedMember.firstName} 
        className="w-5 h-5 rounded-md object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
      />
      <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
        {relatedMember.firstName} {relatedMember.lastName}
      </span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Parents
        </span>
        <div className="flex flex-wrap gap-2">
          {parents.length > 0 ? parents.map(renderPill) : (
            <span className="text-xs italic text-zinc-600 py-1">No parents recorded</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Spouse(s)
        </span>
        <div className="flex flex-wrap gap-2">
          {spouses.length > 0 ? spouses.map(renderPill) : (
            <span className="text-xs italic text-zinc-600 py-1">No spouse recorded</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
          <Baby className="w-3.5 h-3.5" /> Children
        </span>
        <div className="flex flex-wrap gap-2">
          {children.length > 0 ? children.map(renderPill) : (
            <span className="text-xs italic text-zinc-600 py-1">No children recorded</span>
          )}
        </div>
      </div>
    </div>
  );
}
