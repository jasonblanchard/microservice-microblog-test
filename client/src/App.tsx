import React, { useState, useEffect } from 'react';

import HomePage from './pages/HomePage';

interface User {
  id: Number;
  username: String;
}

const App: React.FC = () => {
  const [users, updateUsers] = useState<User[]>();
  const [userId, updateUserId] = useState();

  useEffect(() => {
    async function getUsers() {
      const response = await fetch('/api/users');
      const users = await response.json();
      updateUsers(users);
      updateUserId(users[0].id);
    }

    getUsers();
  }, []);

  function onChangeUserId(event: React.ChangeEvent<HTMLSelectElement>) {
    updateUserId(Number(event.target.value));
  }

  if (!users) return <div>Loading...</div>;

  return (
    <>
      <select onChange={onChangeUserId}>
        {users.map(user => <option key={String(user.id)} value={String(user.id)}>{`${user.id}: ${user.username}`}</option>)}
      </select>
      <HomePage authenticatedUserId={userId} />
    </>
  );
}

export default App;
