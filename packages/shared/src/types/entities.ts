export type Gender = 'male' | 'female';
export type Branch = 'paternal' | 'maternal';
export type RelationshipType = 'biological' | 'adoptive' | 'step';
export type UnionType = 'marriage' | 'partnership' | 'divorced';
export type ArtifactType = 'photo' | 'document' | 'letter' | 'certificate';

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  maidenName: string | null;
  gender: Gender;
  dateOfBirth: string; // ISO date
  dateOfDeath: string | null;
  isDeceased: boolean;
  generation: number;
  branch: Branch;
  profession: string | null;
  residence: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParentChild {
  id: string;
  parentId: string;
  childId: string;
  relationshipType: RelationshipType;
  createdAt: string;
}

export interface Union {
  id: string;
  partner1Id: string;
  partner2Id: string;
  unionType: UnionType;
  unionDate: string | null;
  dissolutionDate: string | null;
  createdAt: string;
}

export interface MediaArtifact {
  id: string;
  memberId: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  artifactType: ArtifactType;
  sortOrder: number;
  createdAt: string;
}

export interface FamilyTree {
  id: string;
  name: string;
  subtitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyTreeFull extends FamilyTree {
  members: FamilyMember[];
  parentChildEdges: ParentChild[];
  unions: Union[];
  artifacts: MediaArtifact[];
}

export type AgeInfo = {
  text: string;
  sub: string;
  isLiving: boolean;
};

export type NodePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Input type for creating a new family member */
export interface CreateMemberInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  maidenName?: string | null;
  gender?: Gender;
  branch?: Branch;
  isDeceased?: boolean;
  dateOfDeath?: string | null;
  profession?: string | null;
  residence?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  spouseId?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
}

/** Input type for updating an existing family member */
export type UpdateMemberInput = Partial<CreateMemberInput>;

/** Input type for creating a spousal union */
export interface CreateUnionInput {
  partner1Id: string;
  partner2Id: string;
  unionType: UnionType;
  unionDate?: string | null;
}

/** Input type for linking a parent to a child */
export interface CreateParentChildInput {
  parentId: string;
  childId: string;
  relationshipType?: RelationshipType;
}
