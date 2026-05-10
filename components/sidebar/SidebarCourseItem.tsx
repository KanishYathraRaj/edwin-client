"use client";
import SidebarItem from "./SidebarItem";
import { MessageSquare, BookOpen, FileText, BrainCircuit, Database, HelpCircle, LayoutGrid } from "lucide-react";
import { usePathname } from "next/navigation";

interface Props {
  courseId: string;
}

const COURSE_FEATURES = [
  { id: "",            label: "Overview",             icon: <LayoutGrid className="w-5 h-5" /> },
  { id: "agent-chat",  label: "Agent Chat",           icon: <MessageSquare className="w-5 h-5" /> },
  { id: "resources",   label: "Resources",            icon: <Database className="w-5 h-5" /> },
  { id: "lesson-planner", label: "Lesson Planner",    icon: <BookOpen className="w-5 h-5" /> },
  { id: "content-prep",   label: "Content Preparation", icon: <FileText className="w-5 h-5" /> },
  { id: "quiz-gen",    label: "Quiz Generation",      icon: <BrainCircuit className="w-5 h-5" /> },
  { id: "question-bank",  label: "Question Bank",     icon: <HelpCircle className="w-5 h-5" /> },
] as const;

export default function SidebarCourseItem({ courseId }: Props) {
  const pathname = usePathname();
  const isPlaceholder = courseId === "__none__";

  return (
    <div className="flex flex-col space-y-0.5">
      {COURSE_FEATURES.map((feature) => (
        <SidebarItem
          key={feature.id || "overview"}
          href={isPlaceholder ? "#" : `/course/${courseId}${feature.id ? `/${feature.id}` : ""}`}
          label={feature.label}
          active={
            !isPlaceholder && (
              feature.id === ""
                ? pathname === `/course/${courseId}`
                : pathname.includes(`/${feature.id}`)
            )
          }
          icon={feature.icon}
        />
      ))}
    </div>
  );
}
