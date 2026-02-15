"use client";
import { useState, useEffect } from "react";
import SidebarItem from "./SidebarItem";
import SidebarCourseItem from "./SidebarCourseItem";
import Link from "next/link";
import { onAuthStateChange, signOutUser } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, Settings } from "lucide-react";

interface Course {
  id: string;
  name: string;
}

export default function Sidebar() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  
  const currentCourseId = params.courseId as string | undefined;

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        const { getUserCourses } = await import("@/lib/firebase/firestore");
        const userCourses = await getUserCourses(user.uid);
        setCourses(userCourses);
      } else {
        setCourses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCourseChange = (newCourseId: string) => {
    if (!newCourseId) return;

    // Determine target path based on current feature
    let targetPath = `/course/${newCourseId}/agent-chat`; // Default

    if (pathname.includes("/lesson-planner")) {
      targetPath = `/course/${newCourseId}/lesson-planner`;
    } else if (pathname.includes("/content-prep")) {
      targetPath = `/course/${newCourseId}/content-prep`;
    } else if (pathname.includes("/quiz-gen")) {
      targetPath = `/course/${newCourseId}/quiz-gen`;
    } else if (pathname.includes("/question-bank")) {
      targetPath = `/course/${newCourseId}/question-bank`;
    }

    router.push(targetPath);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="w-64 h-screen bg-gray-50 border-r flex flex-col font-sans">
      <div className="p-4 border-b bg-white">
        <div className="text-xl font-bold text-gray-900 mb-4 px-1">Edwin AI</div>
        
        {/* Course Selector Dropdown */}
        <div className="relative">
          <select
            value={currentCourseId || ""}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-8 font-medium cursor-pointer"
          >
            <option value="" disabled>Select a Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        <SidebarItem 
          href="/dashboard" 
          label="Dashboard" 
          active={pathname === "/dashboard"}
          icon={<LayoutDashboard className="w-5 h-5" />}
        />
        
        {currentCourseId && (
          <>
            <div className="my-4 px-4">
              <div className="h-px bg-gray-200"></div>
            </div>
            
            <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Course Features
            </div>

            <SidebarCourseItem courseId={currentCourseId} />
          </>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        {user && (
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-colors">
            <div className="truncate pr-2">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Account</p>
              <p className="text-sm font-semibold text-gray-700 truncate" title={user.email || ""}>
                {user.email}
              </p>
            </div>
            <Link 
              href="/settings"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
