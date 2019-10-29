import React, { useState, useEffect } from 'react';

import HomePage from './pages/HomePage';

interface User {
  id: Number;
}

const App: React.FC = () => {
  const [userIds, updateUserIds] = useState<[number]>();
  const [userId, updateUserId] = useState();

  useEffect(() => {
    async function getUsers() {
      const response = await fetch('/api/users');
      const users = await response.json();
      const userIds = users.map((user: User) => user.id);
      updateUserIds(userIds);
      updateUserId(userIds[0]);
    }

    getUsers();
  }, []);

  function onChangeUserId(event: React.ChangeEvent<HTMLSelectElement>) {
    updateUserId(Number(event.target.value));
  }

  if (!userIds) return <div>Loading...</div>;

  return (
    <>
      <select onChange={onChangeUserId}>
        {userIds.map(userId => <option key={userId} value={userId}>{userId}</option>)}
      </select>
      <HomePage authenticatedUserId={userId} />
    </>
  );
}

export default App;
