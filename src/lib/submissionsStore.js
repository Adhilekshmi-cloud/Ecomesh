import { useResource } from './resource';
import { query } from './api';
// Student records are private to /my; staff listing is scoped by the backend and selected school.
export function useSubmissions({ user, token, schoolId, status, studentId, page = 0, revision = 0 }) {
  const path = !user ? null : user.role === 'student' ? '/my/submissions?limit=100' : schoolId ? `/submissions${query({ school_id: schoolId, status, student_id: studentId, limit: 50, skip: page * 50 })}` : null;
  return useResource(path, token, revision, 12000);
}
