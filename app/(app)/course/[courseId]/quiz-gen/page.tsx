export default async function QuizGen({ params }: {
    params: Promise<{
        courseId: string;
    }>;
}) {
    const { courseId } = await params;
    return (
        <div>
            <h1>Quiz Gen {courseId}</h1>
        </div>
    );
}