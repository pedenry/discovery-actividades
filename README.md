# Port Activity Surveillance - Rapid Prototype

A rapid prototype for port activity inspections built with Next.js and Firebase.

## 🚀 Features

- **Dashboard**: Overview of recent inspections with quick actions
- **Activities Management**: Create and manage port activities
- **Templates**: Define inspection templates with customizable items
- **Inspection Wizard**: Step-by-step inspection creation process
- **Evidence Upload**: Attach photos and documents to inspection items
- **Inspection Duplication**: Copy existing inspections (without evidence)
- **Responsive Design**: Optimized for tablets and mobile devices

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Backend**: Firebase (Firestore + Storage)
- **State Management**: TanStack Query
- **Validation**: react-hook-form + zod
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd discovery-actividades-apports
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore Database and Storage
   - Copy your Firebase config

4. **Environment setup**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` with your Firebase configuration.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## 🏗 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── activities/         # Activities management
│   ├── templates/          # Template management
│   ├── inspections/        # Inspection pages
│   │   ├── new/           # Inspection wizard
│   │   └── [id]/          # Individual inspection view
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard
├── components/
│   └── ui/                # Reusable UI components
├── lib/
│   ├── firebase.ts        # Firebase configuration
│   ├── db.ts              # Database operations
│   ├── types.ts           # TypeScript interfaces
│   ├── utils.ts           # Utility functions
│   └── validations.ts     # Zod schemas
└── scripts/
    └── seed.ts            # Database seeding script
```

## 📱 Pages Overview

### Dashboard (`/`)
- Quick access to create new inspections
- Navigation to activities, templates, and inspections
- Recent inspections overview

### Activities (`/activities`)
- List all port activities
- Create new activities with general and follow-up data
- Simple CRUD operations

### Templates (`/templates`)
- Manage inspection templates
- Create templates with custom inspection items
- Pre-loaded "Bar Basic Compliance" template

### Inspections (`/inspections`)
- List all inspections with filtering
- Search by activity name or trade name
- Filter by status (draft, completed, reviewed)
- Duplicate existing inspections

### New Inspection (`/inspections/new`)
- 4-step wizard process:
  1. General Data (legal name, trade name, etc.)
  2. Follow-up Data (contact info, sector, etc.)
  3. Template Selection
  4. Inspection Items (mark compliance)

## 🔥 Firebase Collections

### `activities`
```typescript
{
  id: string
  adminTitleCode: string
  legalName: string
  tradeName: string
  // ... other activity fields
  createdAt: timestamp
  updatedAt: timestamp
}
```

### `templates`
```typescript
{
  id: string
  name: string
  items: {
    [itemId]: {
      id: string
      name: string
      type: "requirement" | "request"
    }
  }
}
```

### `inspections`
```typescript
{
  id: string
  // Activity data fields
  templateId: string
  performedBy: string
  status: "draft" | "completed" | "reviewed"
  items: {
    [itemId]: {
      id: string
      name: string
      type: "requirement" | "request"
      compliance: "compliant" | "nonCompliant" | "n/a"
      evidences: {
        [evidenceId]: {
          id: string
          fileUrl: string
          evidenceType: "documentary" | "observed"
          // ... other evidence fields
        }
      }
    }
  }
  createdAt: timestamp
  updatedAt: timestamp
}
```

## 🧪 Testing

The prototype includes mock data for testing:
- Sample activities (Bar El Puerto, Taller Naval SL)
- Pre-configured templates
- Sample inspection items

## 🚧 Known Limitations

This is a **rapid prototype** with the following limitations:
- No authentication system
- Basic error handling
- Simplified validation
- No offline support
- Limited accessibility features

## 📝 Development Notes

- All lint errors related to missing dependencies will resolve after `npm install`
- The prototype prioritizes speed of development over styling perfection
- Firebase configuration uses demo values by default
- Evidence upload functionality requires proper Firebase Storage setup

## 🔄 Next Steps

1. Install dependencies and test the complete flow
2. Set up Firebase project and update configuration
3. Test inspection creation, evidence upload, and duplication
4. Gather user feedback for UX improvements
5. Iterate on data model based on real-world usage

---

**Note**: This is a disposable prototype for concept validation. It's designed for rapid iteration and user testing, not production use.
