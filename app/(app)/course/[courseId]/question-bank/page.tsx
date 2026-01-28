export default async function QuestionBank({ params }: {
    params: Promise<{
        courseId: string;
    }>;
}) {
    const { courseId } = await params;
    return (
        <div>
            <h1>Question Bank {courseId}</h1>
        </div>
    );
}