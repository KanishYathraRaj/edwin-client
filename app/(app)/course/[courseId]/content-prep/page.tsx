export default async function ContentPrep({ params }: {
    params: Promise<{
        courseId: string;
    }>;
}) {
    const { courseId } = await params;
    return (
        <div>
            <h1>Content Prep {courseId}</h1>
        </div>
    );
}