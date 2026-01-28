"use client";
import { useState, useEffect } from "react";
import SidebarCourseItem from "./SidebarCourseItem";
import SidebarItem from "./SidebarItem";
import Link from "next/link";
import { onAuthStateChange, signOutUser } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  name: string;
}

interface SidebarProps {
  currentCourseId?: string;
  currentFeatureId?: string;
}

export default function Sidebar({ currentCourseId, currentFeatureId }: SidebarProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch courses from Firestore when user is authenticated
        const { getUserCourses } = await import("@/lib/firebase/firestore");
        const userCourses = await getUserCourses(user.uid);
        setCourses(userCourses);
      } else {
        // Clear courses when user logs out
        setCourses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="w-64 h-screen bg-white border-r flex flex-col">
      <div className="p-4 text-xl font-bold border-b">Edwin AI</div>

      <div className="flex-1 overflow-y-auto mt-2">
        <SidebarItem href="/dashboard" label="Dashboard" active={false} />

        <div className="mt-4 px-2 text-gray-500 uppercase text-xs">Courses</div>
        {courses.map((course) => (
          <SidebarCourseItem
            key={course.id}
            course={course}
            currentCourseId={currentCourseId}
            currentFeatureId={currentFeatureId}
          />
        ))}
      </div>

      <div className="p-4 border-t">
        {user && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border group">
            <div className="truncate pr-2">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Account</p>
              <p className="text-sm font-medium text-gray-700 truncate" title={user.email || ""}>
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link 
                href="/settings"
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all flex-shrink-0"
                title="Settings"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all flex-shrink-0"
                title="Logout"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
