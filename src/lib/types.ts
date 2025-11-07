export interface Activity {
  id: string;
  // General Data
  adminTitleCode: string;
  legalName: string;
  tradeName: string;
  titleObject: string;
  adminTitleType: string;
  titleStartDate: Date;
  titleEndDate: Date;
  responsibleName: string;
  // Follow-up Data
  contactPerson: string;
  address: string;
  phone: string;
  email: string;
  followedBy: string;
  followUpDate: Date;
  sector: string;
  headcount: number;
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateItem {
  id: string;
  name: string;
  type: "requirement" | "request";
}

export interface Template {
  id: string;
  name: string;
  items: Record<string, TemplateItem>;
}

export interface Evidence {
  id: string;
  installation: string;
  fileUrl: string;
  evidenceType: "documentary" | "observed";
  installationRef: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  remarks: string;
  required: boolean;
}

export interface InspectionItem {
  id: string;
  name: string;
  type: "requirement" | "request";
  compliance: "compliant" | "nonCompliant" | "n/a";
  evidences: Record<string, Evidence>;
}

export interface Inspection {
  id: string;
  // Activity general data
  adminTitleCode: string;
  legalName: string;
  tradeName: string;
  titleObject: string;
  adminTitleType: string;
  titleStartDate: Date;
  titleEndDate: Date;
  responsibleName: string;
  // Follow-up data
  contactPerson: string;
  address: string;
  phone: string;
  email: string;
  followedBy: string;
  followUpDate: Date;
  sector: string;
  headcount: number;
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
  items: Record<string, InspectionItem>;
  status: "draft" | "completed" | "reviewed";
  performedBy: string;
}

export type ComplianceStatus = "compliant" | "nonCompliant" | "n/a";
export type EvidenceType = "documentary" | "observed";
export type ItemType = "requirement" | "request";
