import { ProjectDetailClient } from '../../../components/ProjectDetailClient';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = await params;
  return <ProjectDetailClient projectId={resolvedParams.id} />;
}
