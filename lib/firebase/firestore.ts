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
