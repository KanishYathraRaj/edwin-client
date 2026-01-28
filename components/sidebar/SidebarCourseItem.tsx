"use client";
import { useState, useEffect } from "react";
import SidebarItem from "./SidebarItem";

interface Course {
  id: string;
  name: string;
}

interface Props {
  course: Course;
  currentCourseId?: string;
  currentFeatureId?: string;
}

const COURSE_FEATURES = [
  { id: "agent-chat", label: "Agent Chat" },
  { id: "lesson-planner", label: "Lesson Planner" },
  { id: "content-prep", label: "Content Preparation" },
  { id: "quiz-gen", label: "Quiz Generation" },
  { id: "question-bank", label: "Question Bank" },
] as const;


export default function SidebarCourseItem({
  course,
  currentCourseId,
  currentFeatureId,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (currentCourseId === course.id) setExpanded(true);
  }, [currentCourseId, course.id]);

  return (
    <div className="mt-1">
      <div
        className="px-4 py-2 cursor-pointer font-medium hover:bg-gray-100 rounded flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        {course.name}
        <span>{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && (
        <div className="ml-4 flex flex-col space-y-1 mt-1">
          {COURSE_FEATURES.map((feature) => (
            <SidebarItem
              key={feature.id}
              href={`/course/${course.id}/${feature.id}`}
              label={feature.label}
              active={currentFeatureId === feature.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
