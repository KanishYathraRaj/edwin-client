import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Sign up a new user with email and password
 */
export async function signUpWithEmail(
    email: string,
    password: string
): Promise<UserCredential> {
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        return userCredential;
    } catch (error: any) {
        throw new Error(error.message || "Failed to sign up");
    }
}

/**
 * Sign in an existing user with email and password
 */
export async function signInWithEmail(
    email: string,
    password: string
): Promise<UserCredential> {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
        return userCredential;
    } catch (error: any) {
        throw new Error(error.message || "Failed to sign in");
    }
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error(error.message || "Failed to sign out");
    }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

/**
 * Listen to authentication state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}
