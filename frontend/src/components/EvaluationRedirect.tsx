import { useParams, Navigate } from 'react-router-dom';

export function EvaluationRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/reports/evaluation/${id}`} replace />;
}