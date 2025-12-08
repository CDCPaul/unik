import { 
  collection, 
  getDocs, 
  doc,
  addDoc,
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { GalleryImage } from '@unik/shared/types';

const COLLECTION = 'gallery';

// Get all gallery images
export async function getGalleryImages(): Promise<GalleryImage[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as GalleryImage[];
  } catch (error) {
    console.error('Error getting gallery images:', error);
    return [];
  }
}

// Add new image
export async function addGalleryImage(image: Omit<GalleryImage, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...image,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding image:', error);
    throw error;
  }
}

// Update image
export async function updateGalleryImage(id: string, image: Partial<GalleryImage>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, image);
  } catch (error) {
    console.error('Error updating image:', error);
    throw error;
  }
}

// Delete image
export async function deleteGalleryImage(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

// Upload image to storage
export async function uploadGalleryImage(file: File): Promise<string> {
  try {
    const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Delete image from storage
export async function deleteGalleryImageFile(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image file:', error);
  }
}

