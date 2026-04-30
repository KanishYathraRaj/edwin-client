"use client";

import { use } from "react";

export default function Course({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);
    return (
        <div>
            <h1>Course {courseId}</h1>
        </div>
    );
}