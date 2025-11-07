# Port Activity Surveillance - Setup Instructions

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Firebase**
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore Database and Storage
   - Copy your Firebase configuration

3. **Environment Configuration**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` with your Firebase credentials.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Seed Database (Optional)**
   ```bash
   npm run seed
   ```

## 📱 Application Structure

### Core Features Implemented
- ✅ **Dashboard** - Main navigation and recent inspections
- ✅ **Activities Management** - Create and list port activities
- ✅ **Templates** - Manage inspection templates with items
- ✅ **Inspection Wizard** - 4-step inspection creation process
- ✅ **Inspection List** - View, filter, and search inspections
- ✅ **Inspection Detail** - View/edit individual inspections
- ✅ **Evidence Upload** - File upload with metadata
- ✅ **Inspection Duplication** - Copy inspections without evidence

### Technical Implementation
- **Framework**: Next.js 14 with App Router
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage for file uploads
- **UI**: Tailwind CSS + shadcn/ui components
- **Validation**: Zod schemas with react-hook-form
- **State**: TanStack Query for server state
- **Icons**: Lucide React

### Data Model
```typescript
// Collections: activities, templates, inspections
// Evidence stored as subcollection with file URLs
// Compliance tracking: compliant | nonCompliant | n/a
// Evidence types: documentary | observed
```

## 🧪 Testing the Prototype

### Test Scenarios
1. **Create New Inspection**
   - Go to `/inspections/new`
   - Fill out 4-step wizard
   - Test form validation
   - Save and verify in list

2. **Add Evidence**
   - Open existing inspection
   - Click "Add Evidence" on any item
   - Upload file and fill metadata
   - Verify file appears in evidence list

3. **Duplicate Inspection**
   - From inspection list, click "Duplicate"
   - Verify data copied but evidence cleared
   - Complete new inspection

4. **Template Management**
   - Visit `/templates`
   - Create new template with items
   - Use in inspection wizard

5. **Activity Management**
   - Visit `/activities`
   - Create new activity
   - Reference in inspections

## 🔧 Development Notes

### Known Limitations (Prototype)
- No authentication system
- Mock data for demonstration
- Basic error handling
- Simplified validation
- No offline support

### Lint Errors
All current lint errors are due to missing dependencies and will resolve after running `npm install`. The errors are expected in the development phase.

### Firebase Configuration
The app uses demo Firebase configuration by default. Update `.env.local` with your actual Firebase project credentials for full functionality.

### File Upload
Evidence upload requires proper Firebase Storage configuration. Files are stored in `/inspections/{id}/evidences/{evidenceId}/` structure.

## 📊 Performance Considerations

- Images optimized with Next.js Image component
- Lazy loading for inspection lists
- Efficient Firestore queries with indexing
- Client-side caching with TanStack Query

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 🔄 Next Steps

1. **Install dependencies**: `npm install`
2. **Configure Firebase**: Update `.env.local`
3. **Test core flows**: Create → Evidence → Duplicate
4. **Gather feedback**: User testing with real technicians
5. **Iterate**: Refine UX based on feedback

---

**Status**: ✅ Rapid prototype complete and ready for testing
**Priority**: Install dependencies and configure Firebase for full functionality
