import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { Activity, Template, Inspection, Evidence } from './types';

// Helper to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any) => {
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
};

// Activities
export const createActivity = async (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'activities'), {
    ...activity,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const getActivities = async (): Promise<Activity[]> => {
  const snapshot = await getDocs(query(collection(db, 'activities'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Activity));
};

export const getActivity = async (id: string): Promise<Activity | null> => {
  const docRef = doc(db, 'activities', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...convertTimestamps(snapshot.data())
  } as Activity;
};

// Templates
export const createTemplate = async (template: Omit<Template, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'templates'), template);
  return docRef.id;
};

export const getTemplates = async (): Promise<Template[]> => {
  const snapshot = await getDocs(collection(db, 'templates'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Template));
};

export const getTemplate = async (id: string): Promise<Template | null> => {
  const docRef = doc(db, 'templates', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Template;
};

export const updateTemplate = async (id: string, updates: Partial<Template>): Promise<void> => {
  const docRef = doc(db, 'templates', id);
  await updateDoc(docRef, updates);
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const docRef = doc(db, 'templates', id);
  await deleteDoc(docRef);
};

// Inspections
export const createInspection = async (inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, 'inspections'), {
    ...inspection,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const getInspections = async (): Promise<Inspection[]> => {
  const snapshot = await getDocs(query(collection(db, 'inspections'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Inspection));
};

export const getInspection = async (id: string): Promise<Inspection | null> => {
  const docRef = doc(db, 'inspections', id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...convertTimestamps(snapshot.data())
  } as Inspection;
};

export const updateInspection = async (id: string, updates: Partial<Inspection>): Promise<void> => {
  const docRef = doc(db, 'inspections', id);
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };
  await updateDoc(docRef, updateData);
};

export const duplicateInspection = async (sourceId: string): Promise<string> => {
  const sourceInspection = await getInspection(sourceId);
  if (!sourceInspection) throw new Error('Source inspection not found');

  // Copy inspection data but remove evidences from items
  const duplicatedItems: Record<string, any> = {};
  Object.entries(sourceInspection.items).forEach(([itemId, item]) => {
    duplicatedItems[itemId] = {
      ...item,
      evidences: {}, // Clear evidences as per requirement
    };
  });

  const duplicatedInspection = {
    ...sourceInspection,
    items: duplicatedItems,
    status: 'draft' as const,
  };

  // Remove fields that shouldn't be duplicated
  delete (duplicatedInspection as any).id;
  delete (duplicatedInspection as any).createdAt;
  delete (duplicatedInspection as any).updatedAt;

  return await createInspection(duplicatedInspection);
};

export const deleteInspection = async (id: string): Promise<void> => {
  const docRef = doc(db, 'inspections', id);
  await deleteDoc(docRef);
};

// Evidence and File Upload
export const uploadFile = async (file: File, inspectionId: string, evidenceId: string): Promise<string> => {
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `inspections/${inspectionId}/evidences/${evidenceId}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
};

export const addEvidence = async (
  inspectionId: string, 
  itemId: string, 
  evidence: Omit<Evidence, 'id'>,
  file?: File
): Promise<string> => {
  const evidenceId = `evidence_${Date.now()}`;
  
  let fileUrl = evidence.fileUrl;
  if (file) {
    fileUrl = await uploadFile(file, inspectionId, evidenceId);
  }

  const inspection = await getInspection(inspectionId);
  if (!inspection) throw new Error('Inspection not found');

  const updatedItems = { ...inspection.items };
  if (!updatedItems[itemId]) {
    throw new Error('Item not found in inspection');
  }

  updatedItems[itemId] = {
    ...updatedItems[itemId],
    evidences: {
      ...updatedItems[itemId].evidences,
      [evidenceId]: {
        ...evidence,
        id: evidenceId,
        fileUrl,
      }
    }
  };

  await updateInspection(inspectionId, { items: updatedItems });
  return evidenceId;
};

// Filtering helpers
export const getInspectionsByStatus = async (status: string): Promise<Inspection[]> => {
  const snapshot = await getDocs(
    query(
      collection(db, 'inspections'), 
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Inspection));
};

export const getInspectionsByActivity = async (activityId: string): Promise<Inspection[]> => {
  const snapshot = await getDocs(
    query(
      collection(db, 'inspections'), 
      where('activityId', '==', activityId),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Inspection));
};
