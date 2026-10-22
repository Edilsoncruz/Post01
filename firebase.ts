import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { ProjectHistoryItem, Idea, MarketingInputs } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyBE536tn2uM8IyK9WqwlJo4LuCuAl4mmUY",
  authDomain: "geradorpost-484d0.firebaseapp.com",
  projectId: "geradorpost-484d0",
  storageBucket: "geradorpost-484d0.firebasestorage.app",
  messagingSenderId: "145765851267",
  appId: "1:145765851267:web:307aaee9c315a4255cfbb6",
  measurementId: "G-C2VFTNJZL1"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const storage = getStorage(app);

// Helper to compress/resize base64 image (useful fallback to avoid hitting Firestore 1MB document limit)
interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export const compressBase64Image = (base64Str: string, options: CompressOptions = {}): Promise<string> => {
  return new Promise((resolve) => {
    const { maxWidth = 800, maxHeight = 800, quality = 0.6 } = options;
    if (typeof window === "undefined") {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

// Helper to upload base64 image to Storage and get URL
export const uploadBase64Image = async (base64String: string, path: string): Promise<string> => {
  if (!base64String || !base64String.startsWith('data:image')) {
    return base64String; // Already a URL or invalid/empty
  }
  try {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64String, 'data_url');
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.warn(`Firebase Storage upload failed for ${path} (${error.message || error}). Falling back to compressed inline base64 image.`, error);
    try {
      // Compress the image to avoid hitting Firestore's 1MB limit when stored inline
      return await compressBase64Image(base64String, { maxWidth: 600, maxHeight: 600, quality: 0.5 });
    } catch (compressErr) {
      console.warn("Image compression fallback failed or bypassed:", compressErr);
      return base64String;
    }
  }
};

export const saveProjectToFirebase = async (item: ProjectHistoryItem): Promise<void> => {
  const projectId = item.id;
  
  // 1. Upload input images
  const uploadedInputImages = await Promise.all(
    item.inputs.imagesBase64.map((base64, idx) => 
      uploadBase64Image(base64, `projects/${projectId}/inputs/img_${idx}.jpg`)
    )
  );

  // 2. Upload idea images
  const processedIdeas = await Promise.all(item.ideas.map(async (idea, ideaIdx) => {
    const newIdea = { ...idea };
    
    if (newIdea.generatedImageUrls) {
      newIdea.generatedImageUrls = await Promise.all(
        newIdea.generatedImageUrls.map(async (url, varIdx) => {
          if (url) {
            return await uploadBase64Image(url, `projects/${projectId}/ideas/${ideaIdx}/var_${varIdx}.jpg`);
          }
          return url;
        })
      );
    }

    if (newIdea.storyboard?.scenes) {
      newIdea.storyboard.scenes = await Promise.all(
        newIdea.storyboard.scenes.map(async (scene, sceneIdx) => {
          if (scene.imageUrl) {
            scene.imageUrl = await uploadBase64Image(scene.imageUrl, `projects/${projectId}/ideas/${ideaIdx}/scene_${sceneIdx}.jpg`);
          }
          return scene;
        })
      );
    }
    
    return newIdea;
  }));

  // 3. Prepare data for Firestore (remove File objects)
  const firestoreData = {
    ...item,
    inputs: {
      ...item.inputs,
      images: [], // Remove File objects
      imagesBase64: uploadedInputImages
    },
    ideas: processedIdeas
  };

  // 4. Save to Firestore
  await setDoc(doc(db, "projects", projectId), firestoreData);
};

export const loadProjectsFromFirebase = async (): Promise<ProjectHistoryItem[]> => {
  const q = query(collection(db, "projects"), orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  const projects: ProjectHistoryItem[] = [];
  querySnapshot.forEach((doc) => {
    projects.push(doc.data() as ProjectHistoryItem);
  });
  return projects;
};

export const deleteProjectFromFirebase = async (projectId: string): Promise<void> => {
  await deleteDoc(doc(db, "projects", projectId));
  // Note: In a production app, you'd also want to delete the images from Storage here
};

