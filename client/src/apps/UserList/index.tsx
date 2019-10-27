import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
}

interface UserListProps {
  authenticatedUserId: number;
}

interface UserDisplayProps {
  user: User;
  authenticatedUserId: number;
}

function UserDisplay({ user, authenticatedUserId }: UserDisplayProps) {
  function handleClick() {
    fetch('api/follows', {
      method: 'POST',
      body: JSON.stringify({
        toBeFollowedId: user.id
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authenticatedUserId}`
      }
    })
  }

  return (
    <div>
      {user.username}
      <button onClick={handleClick}>follow</button>
    </div>
  )
}

export default function UserList({ authenticatedUserId }: UserListProps) {
  const [users, updateUsers] = useState<[User]>();

  useEffect(() => {
    async function getUser() {
      const fetchResponse = await fetch('/api/users');
      const users = await fetchResponse.json();
      updateUsers(users);
    };

    getUser();
  }, []);

  if (!users) return <div>Loading...</div>;

  return (
    <div>
      Users:
      {users.map(user => user.id !== authenticatedUserId && <UserDisplay key={user.id} user={user} authenticatedUserId={authenticatedUserId} />)}
    </div>
  )
}
