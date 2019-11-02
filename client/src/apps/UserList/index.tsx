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
  onAfterClick: (userId: number) => void;
}

function UserDisplay({ user, authenticatedUserId, onAfterClick }: UserDisplayProps) {
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
    }).then(() => {
      onAfterClick(user.id);
    });
  }

  return (
    <div>
      {user.username}
      <button onClick={handleClick}>follow</button>
    </div>
  )
}

export default function UserList({ authenticatedUserId }: UserListProps) {
  const [users, updateUsers] = useState<User[]>();
  const [follows, updateFollows] = useState<number[]>([]);

  useEffect(() => {
    async function getUser() {
      const fetchResponse = await fetch('/api/users');
      const users = await fetchResponse.json();
      updateUsers(users);
    };

    async function getFollows() {
      const fetchResponse = await fetch(`/api/users/${authenticatedUserId}/follows`);
      const follows = await fetchResponse.json();
      updateFollows(follows);
    };

    getUser();
    getFollows();
  }, [authenticatedUserId]);

  if (!users || !follows) return <div>Loading...</div>;

  const filteredUsers = users.filter(user => !follows.includes(Number(user.id)) && user.id !== authenticatedUserId);

  interface UsersById {
    [key: string]: User;
  }

  const usersById = users.reduce((usersById: UsersById, user) => {
    usersById[user.id] = user;
    return usersById;
  }, {});

  const friends = follows.map(id => usersById[id]);

  function onAfterClickFollow(userId: number) {
    updateFollows(follows => [...follows, userId]);
  }

  return (
    <div>
      <h2>Users:</h2>
      {filteredUsers.length === 0 ? 'You are following everybody!' : filteredUsers.map(user => <UserDisplay key={user.id} user={user} authenticatedUserId={authenticatedUserId} onAfterClick={onAfterClickFollow} />)}
      <hr />
      <h2>Your friends:</h2>
      {friends.length === 0 ? 'Follow some people' : friends.map(user => <div key={user.id}>{user.username}</div>)}
    </div>
  )
}
