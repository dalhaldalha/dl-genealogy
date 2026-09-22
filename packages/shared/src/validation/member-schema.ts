import { z } from 'zod';

const memberBaseSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  maidenName: z.string().nullable().optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).default('male'),
  branch: z.enum(['paternal', 'maternal']).optional(),
  isDeceased: z.boolean().default(false).optional(),
  generation: z.number().int().optional(),
  dateOfDeath: z.string().nullable().optional().or(z.literal('')),
  profession: z.string().nullable().optional().or(z.literal('')),
  residence: z.string().nullable().optional().or(z.literal('')),
  bio: z.string().nullable().optional().or(z.literal('')),
  avatarUrl: z.string().nullable().optional().or(z.literal('')),
  spouseId: z.string().nullable().optional().or(z.literal('')),
  fatherId: z.string().nullable().optional().or(z.literal('')),
  motherId: z.string().nullable().optional().or(z.literal('')),
});

export const createMemberSchema = memberBaseSchema.refine((data) => {
  if (data.isDeceased) {
    return Boolean(data.dateOfDeath && data.dateOfDeath.trim() !== '');
  }
  return true;
}, {
  message: "Date of death must be provided if the member is deceased",
  path: ["dateOfDeath"],
});

export const updateMemberSchema = memberBaseSchema.partial();

export const createUnionSchema = z.object({
  partner1Id: z.string().uuid(),
  partner2Id: z.string().uuid(),
  unionType: z.enum(['marriage', 'partnership', 'divorced']),
  unionDate: z.string().optional()
}).refine(data => data.partner1Id !== data.partner2Id, {
  message: "Partners cannot be the same person",
  path: ["partner2Id"]
});

export const createParentChildSchema = z.object({
  parentId: z.string().uuid(),
  childId: z.string().uuid(),
  relationshipType: z.enum(['biological', 'adoptive', 'step'])
}).refine(data => data.parentId !== data.childId, {
  message: "Parent and child cannot be the same person",
  path: ["childId"]
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  branch: z.enum(['paternal', 'maternal']).optional()
});
