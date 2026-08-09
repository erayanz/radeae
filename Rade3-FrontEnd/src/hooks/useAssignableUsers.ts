import { useState, useEffect } from 'react';
import { usersApi, AssignableUser } from '../api/usersApi';

export function useAssignableUsers() {
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);

  useEffect(() => {
    // Deactivated users can't log in, so assigning an event to one would be
    // a dead end -- exclude them from the assign dropdown, but the Users
    // management page itself still lists everyone (it needs to, to let an
    // admin reactivate someone).
    usersApi.getUsers()
      .then(users => setAssignableUsers(users.filter(u => u.active)))
      .catch(() => setAssignableUsers([]));
  }, []);

  return assignableUsers;
}
