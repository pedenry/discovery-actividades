# PRD - Port Activity Surveillance Rapid Prototype

**Version:** 0.1  
**Date:** November 2025

## 1. Executive Summary

### 1.1 Purpose
Validate with users the complete flow of environmental and quality inspections performed by technicians in ports. The prototype is disposable and will be used to iterate UX and data structure.

### 1.2 Objective
Develop a functional prototype that allows technicians to perform inspections of concessionaire activities in ports (bars, workshops, nautical clubs, etc.) efficiently and digitally.

## 2. Users and Roles

### 2.1 Quality and Environmental Technician
- **Description:** Performs inspections of concessionaire activities in ports
- **Platform:** Tablet / Mobile
- **Responsibilities:** Execute inspections, record evidence, complete forms

### 2.2 System Administrator
- **Description:** Loads inspection templates and supervises results (testing only)
- **Platform:** Web (internal testing only)
- **Responsibilities:** Configure templates, supervise test results

## 3. Use Cases

### 3.1 Primary Use Cases
1. **Register new activity** with general data
2. **Load template** associated with activity type
3. **Mark item compliance** and add evidence
4. **Duplicate previous inspection** to update expired documents
5. **Attach photos or documents** as evidence
6. **Save and query** completed inspections

## 4. User Flows

### 4.1 F1 - Create New Inspection
1. Select 'New Inspection'
2. Enter general data
3. Enter follow-up data
4. Select template
5. Load associated items
6. Mark item compliance (compliant / nonCompliant / n/a)
7. Add evidence if applicable
8. Save inspection

### 4.2 F2 - Duplicate Previous Inspection
1. Access past inspection
2. Select 'Duplicate Inspection'
3. Copy inspection data and items (evidence NOT copied)
4. Update expired documents with new evidence

### 4.3 F3 - Add New Item During Inspection
1. Open existing inspection
2. Add new item (name, type, compliance status)
3. Add evidence if applicable

## 5. Data Model

### 5.1 Activity

#### 5.1.1 General Data
- **adminTitleCode:** string - Administrative title code
- **legalName:** string - Company legal name
- **tradeName:** string - Commercial trade name
- **titleObject:** string - Title object description
- **adminTitleType:** string - Administrative title type
- **titleStartDate:** date - Title start date
- **titleEndDate:** date - Title end date
- **responsibleName:** string - Responsible person name

#### 5.1.2 Follow-up Data
- **contactPerson:** string - Contact person
- **address:** string - Address
- **phone:** string - Phone number
- **email:** string - Email address
- **followedBy:** string - Follow-up performed by
- **followUpDate:** date - Follow-up date
- **sector:** string - Activity sector
- **headcount:** number - Number of employees
- **templateId:** string - Reference to template used

### 5.2 Template
- **id:** string - Unique identifier
- **name:** string - Template name
- **items:** array - Inspection items array
  - **id:** string - Item identifier
  - **name:** string - Item name
  - **type:** "requirement" | "request" - Item type
  - **compliance:** "compliant" | "nonCompliant" | "n/a" - Compliance status
  - **evidences:** array - References to evidence

### 5.3 Evidence
- **installation:** string - Related installation
- **fileUrl:** string - Document or photo URL
- **evidenceType:** "documentary" | "observed" - Evidence type
- **installationRef:** string - Installation reference
- **issuer:** string - Document issuer
- **validFrom:** date - Validity start date
- **validTo:** date - Validity end date
- **remarks:** string - Additional observations
- **required:** boolean - Whether evidence is required

## 6. Functional Requirements

| Code | Description | Priority |
|------|-------------|----------|
| RF-01 | Create, edit and delete inspections | High |
| RF-02 | Load predefined item templates | High |
| RF-03 | Duplicate inspections (data only, not evidence) | Medium |
| RF-04 | Add multiple evidence with defined fields | High |
| RF-05 | Attach photos or documents | High |
| RF-06 | Add new items manually during inspection | Medium |
| RF-07 | Validate required fields and formats | High |
| RF-08 | Persist data in Firestore | High |
| RF-09 | Design responsive mobile/tablet interface | High |

## 7. Technical Requirements

### 7.1 Technology Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Firebase (Firestore, Storage, optional Auth)
- **Hosting:** Vercel or Firebase Hosting
- **Responsive:** Yes (mobile and tablet optimized)

### 7.2 Firestore Structure

```typescript
// Collection: templates
templates/{templateId} {
  id: string;
  name: string;
  items: {
    [itemId]: {
      id: string;
      name: string;
      type: "requirement" | "request";
    }
  }
}

// Collection: inspections
inspections/{inspectionId} {
  id: string;
  // Activity general data
  adminTitleCode: string;
  legalName: string;
  tradeName: string;
  titleObject: string;
  adminTitleType: string;
  titleStartDate: date;
  titleEndDate: date;
  responsibleName: string;
  
  // Follow-up data
  contactPerson: string;
  address: string;
  phone: string;
  email: string;
  followedBy: string;
  followUpDate: date;
  sector: string;
  headcount: number;
  
  templateId: string;
  createdAt: timestamp;
  updatedAt: timestamp;
  
  items: {
    [itemId]: {
      id: string;
      name: string;
      type: "requirement" | "request";
      compliance: "compliant" | "nonCompliant" | "n/a";
      evidences: {
        [evidenceId]: {
          id: string;
          installation: string;
          fileUrl: string;
          evidenceType: "documentary" | "observed";
          installationRef: string;
          issuer: string;
          validFrom: date;
          validTo: date;
          remarks: string;
          required: boolean;
        }
      }
    }
  }
}
```

### 7.3 Feature Flags
- **FEATURE_USE_FIREBASE:** `boolean` - Toggle between real Firestore and local mocks

### 7.4 Testing Setup
- Mock data with 3 sample items and 2 sample evidences
- Test templates for different activity types

## 8. Acceptance Criteria

### 8.1 Primary Criteria
- ✅ Technician can complete an inspection without errors
- ✅ UI is usable on tablet and mobile devices
- ✅ Duplicated inspections maintain data but create new evidence entries
- ✅ Firestore hierarchy is created correctly
- ✅ Forms validate dates and email formats
- ✅ Evidence can be added dynamically without page reload
- ✅ File uploads work correctly with Firebase Storage

## 9. UX/UI Considerations

### 9.1 Responsive Design
- Optimized for tablets and mobile devices
- Intuitive interface for field technicians
- Simple navigation between forms
- Touch-friendly controls

### 9.2 Usability
- Real-time form validation
- Camera integration for photo capture
- Auto-save functionality
- Clear visual feedback for compliance status

## 10. Limitations and Considerations

### 10.1 Prototype Scope
- This is a disposable prototype for concept validation
- Focus on UX and data structure iteration
- Not designed for long-term production use
- Admin functionality is for internal testing only

### 10.2 Excluded Features
- Offline mode (excluded for now)
- Complex permission system
- Advanced reporting features
- Multi-tenant architecture

## 11. Next Steps

1. **Prototype Development** following technical specifications
2. **User Testing** with real quality and environmental technicians
3. **Feedback Iteration** based on user insights
4. **Data Model Refinement** according to identified needs
5. **Production Version Planning** based on prototype learnings

---

*This document will be updated as the prototype development evolves and user feedback is incorporated.*
