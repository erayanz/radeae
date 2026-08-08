import { useState, useEffect } from 'react';
import { usersApi, AssignableUser } from '../api/usersApi';

export function useAssignableUsers() {
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);

  useEffect(() => {
    usersApi.getUsers().then(setAssignableUsers).catch(() => setAssignableUsers([]));
  }, []);

  return assignableUsers;
}
