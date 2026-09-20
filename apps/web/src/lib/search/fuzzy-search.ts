import type { FamilyMember } from '@kinfolk/shared';

/**
 * Filters members based on fuzzy string match on key fields
 */
export function searchMembers(members: FamilyMember[], query: string): FamilyMember[] {
  if (!query || query.trim() === '') return members;
  const lowerQuery = query.toLowerCase();

  return members.filter(member => {
    return (
      (member.firstName && member.firstName.toLowerCase().includes(lowerQuery)) ||
      (member.lastName && member.lastName.toLowerCase().includes(lowerQuery)) ||
      (member.profession && member.profession.toLowerCase().includes(lowerQuery)) ||
      (member.residence && member.residence.toLowerCase().includes(lowerQuery)) ||
      (member.dateOfBirth && member.dateOfBirth.toLowerCase().includes(lowerQuery))
    );
  });
}
