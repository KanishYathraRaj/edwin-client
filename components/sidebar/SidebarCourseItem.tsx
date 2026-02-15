"use client";
import SidebarItem from "./SidebarItem";
import { MessageSquare, BookOpen, FileText, BrainCircuit, Database } from "lucide-react";
import { usePathname } from "next/navigation";

interface Props {
  courseId: string;
}

const COURSE_FEATURES = [
  { id: "agent-chat", label: "Agent Chat", icon: <MessageSquare className="w-5 h-5" /> },
  { id: "resources", label: "Resources", icon: <Database className="w-5 h-5" /> },
  { id: "lesson-planner", label: "Lesson Planner", icon: <BookOpen className="w-5 h-5" /> },
  { id: "content-prep", label: "Content Preparation", icon: <FileText className="w-5 h-5" /> },
  { id: "quiz-gen", label: "Quiz Generation", icon: <BrainCircuit className="w-5 h-5" /> },
  { id: "question-bank", label: "Question Bank", icon: <Database className="w-5 h-5" /> },
] as const;

export default function SidebarCourseItem({ courseId }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col space-y-1">
      {COURSE_FEATURES.map((feature) => (
        <SidebarItem
          key={feature.id}
          href={`/course/${courseId}/${feature.id}`}
          label={feature.label}
          active={pathname.includes(`/${feature.id}`)}
          icon={feature.icon}
        />
      ))}
    </div>
  );
}
