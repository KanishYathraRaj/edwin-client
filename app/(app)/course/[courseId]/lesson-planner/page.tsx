export default async function LessonPlanner({ params }: {
    params: Promise<{
        courseId: string;
    }>;
}) {
    const { courseId } = await params;
    return (
        <div>
            <h1>Lesson Planner {courseId}</h1>
        </div>
    );
}