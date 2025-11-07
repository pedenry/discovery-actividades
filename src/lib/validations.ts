import { z } from 'zod';

export const activitySchema = z.object({
  adminTitleCode: z.string().min(1, 'Administrative title code is required'),
  legalName: z.string().min(1, 'Legal name is required'),
  tradeName: z.string().min(1, 'Trade name is required'),
  titleObject: z.string().min(1, 'Title object is required'),
  adminTitleType: z.string().min(1, 'Administrative title type is required'),
  titleStartDate: z.date(),
  titleEndDate: z.date(),
  responsibleName: z.string().min(1, 'Responsible name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email format'),
  followedBy: z.string().min(1, 'Followed by is required'),
  followUpDate: z.date(),
  sector: z.string().min(1, 'Sector is required'),
  headcount: z.number().min(0, 'Headcount must be positive'),
  templateId: z.string().min(1, 'Template is required'),
});

export const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  items: z.record(z.object({
    id: z.string(),
    name: z.string().min(1, 'Item name is required'),
    type: z.enum(['requirement', 'request']),
  })),
});

export const evidenceSchema = z.object({
  installation: z.string().min(1, 'Installation is required'),
  evidenceType: z.enum(['documentary', 'observed']),
  installationRef: z.string().min(1, 'Installation reference is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  validFrom: z.date(),
  validTo: z.date(),
  remarks: z.string().optional(),
  required: z.boolean(),
});

export const inspectionSchema = z.object({
  adminTitleCode: z.string().min(1, 'Administrative title code is required'),
  legalName: z.string().min(1, 'Legal name is required'),
  tradeName: z.string().min(1, 'Trade name is required'),
  titleObject: z.string().min(1, 'Title object is required'),
  adminTitleType: z.string().min(1, 'Administrative title type is required'),
  titleStartDate: z.date(),
  titleEndDate: z.date(),
  responsibleName: z.string().min(1, 'Responsible name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email format'),
  followedBy: z.string().min(1, 'Followed by is required'),
  followUpDate: z.date(),
  sector: z.string().min(1, 'Sector is required'),
  headcount: z.number().min(0, 'Headcount must be positive'),
  templateId: z.string().min(1, 'Template is required'),
  performedBy: z.string().min(1, 'Performed by is required'),
  status: z.enum(['draft', 'completed', 'reviewed']).default('draft'),
});

export type ActivityFormData = z.infer<typeof activitySchema>;
export type TemplateFormData = z.infer<typeof templateSchema>;
export type EvidenceFormData = z.infer<typeof evidenceSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;
