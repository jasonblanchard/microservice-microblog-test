import React, { useState } from 'react';

interface HomePageState {
  authenticatedUserId: number;
}

export default function Post({ authenticatedUserId }: HomePageState) {
  const [text, updateText] = useState();

  function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();

    fetch('/api/entries', {
      method: 'POST',
      body: JSON.stringify({
        text
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authenticatedUserId}`
      }
    })
    .then(() => {
      updateText('');
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea value={text} onChange={event => updateText(event.target.value)} />
      <button disabled={!text}>submit</button>
    </form>
  );
}
