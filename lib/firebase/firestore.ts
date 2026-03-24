import { collection, getDocs, query } from "firebase/firestore";
import { db } from "./firebase";

export interface Course {
    id: string;
    name: string;
}

/**
 * Fetch all courses for a specific user from Firestore
 * @param userId - The user's Firebase UID
 * @returns Array of courses
 */
export async function getUserCourses(userId: string): Promise<Course[]> {
    try {
        const coursesRef = collection(db, "users", userId, "courses");
        const q = query(coursesRef);
        const querySnapshot = await getDocs(q);

        const courses: Course[] = [];
        querySnapshot.forEach((doc) => {
            courses.push({
                id: doc.id,
                name: doc.data().title || "Untitled Course",
            });
        });

        return courses;
    } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
}

/**
 * Create a new course for a user
 * @param userId - The user's Firebase UID
 * @param title - The title of the course
 * @returns The created course object
 */
export async function createCourse(userId: string, title: string): Promise<Course | null> {
    try {
        const { addDoc, collection } = await import("firebase/firestore");
        const docRef = await addDoc(collection(db, "users", userId, "courses"), {
            title,
            createdAt: new Date(),
        });

        return {
            id: docRef.id,
            name: title,
        };
    } catch (error) {
        console.error("Error creating course:", error);
        return null;
    }
}

/**
 * Delete a course for a user
 * @param userId - The user's Firebase UID
 * @param courseId - The ID of the course to delete
 */
export async function deleteCourse(userId: string, courseId: string): Promise<boolean> {
    try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "users", userId, "courses", courseId));
        return true;
    } catch (error) {
        console.error("Error deleting course:", error);
        return false;
    }
}

/**
 * Fetch chat history for a specific course
 * @param userId - The user's Firebase UID
 * @param courseId - The ID of the course
 * @returns Array of chat messages
 */
export async function getCourseChatHistory(userId: string, courseId: string): Promise<any[]> {
    try {
        const { doc, getDoc } = await import("firebase/firestore");
        const courseRef = doc(db, "users", userId, "courses", courseId);
        const courseDoc = await getDoc(courseRef);

        if (courseDoc.exists()) {
            return courseDoc.data().history || [];
        }
        return [];
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
    }
}
/**
 * Fetch full course details
 * @param userId - The user's Firebase UID
 * @param courseId - The ID of the course
 * @returns Course data or null
 */
export async function getCourseDetails(userId: string, courseId: string): Promise<any | null> {
    try {
        const { doc, getDoc } = await import("firebase/firestore");
        const courseRef = doc(db, "users", userId, "courses", courseId);
        const courseDoc = await getDoc(courseRef);

        if (courseDoc.exists()) {
            return { id: courseDoc.id, ...courseDoc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching course details:", error);
        return null;
    }
}

/**
 * Save prepared content to a course
 * @param userId - The user's Firebase UID
 * @param courseId - The ID of the course
 * @param content - The generated markdown content
 * @param title - A title for the content
 * @param existingId - (Optional) ID of existing document to update
 */
export async function savePreparedContent(userId: string, courseId: string, content: string, title: string, existingId?: string): Promise<string | null> {
    try {
        const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
        
        if (existingId) {
            const docRef = doc(db, "users", userId, "courses", courseId, "preparedContent", existingId);
            await updateDoc(docRef, {
                content,
                title,
                updatedAt: serverTimestamp()
            });
            return existingId;
        } else {
            const docRef = await addDoc(collection(db, "users", userId, "courses", courseId, "preparedContent"), {
                content,
                title,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        }
    } catch (error) {
        console.error("Error saving prepared content:", error);
        return null;
    }
}

/**
 * Fetch all saved prepared content for a course
 * @param userId - The user's Firebase UID
 * @param courseId - The ID of the course
 * @returns Array of saved content items
 */
export async function getSavedPreparedContent(userId: string, courseId: string): Promise<any[]> {
    try {
        const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
        const contentRef = collection(db, "users", userId, "courses", courseId, "preparedContent");
        const q = query(contentRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        const items: any[] = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    } catch (error) {
        console.error("Error fetching saved content:", error);
        return [];
    }
}

/**
 * Delete a saved prepared content item
 * @param userId - The user's Firebase UID
 * @param courseId - The ID of the course
 * @param contentId - The ID of the prepared content document
 */
export async function deletePreparedContent(userId: string, courseId: string, contentId: string): Promise<boolean> {
    try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "users", userId, "courses", courseId, "preparedContent", contentId));
        return true;
    } catch (error) {
        console.error("Error deleting prepared content:", error);
        return false;
    }
}

/**
 * Update just the title of a saved prepared content item
 * @param userId - The user's Firebase UID
 * @param courseId - The ID of the course
 * @param contentId - The ID of the document
 * @param title - The new title
 */
export async function updatePreparedContentTitle(userId: string, courseId: string, contentId: string, title: string): Promise<boolean> {
    try {
        const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
        const docRef = doc(db, "users", userId, "courses", courseId, "preparedContent", contentId);
        await updateDoc(docRef, {
            title,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating title:", error);
        return false;
    }
}
