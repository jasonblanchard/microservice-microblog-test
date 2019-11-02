import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

interface TimelineProps {
  authenticatedUserId: number;
}

interface Entry {
  id: number;
  text: string;
  creator: {
    username: string;
  }
}

interface EntryProps {
  entry: Entry;
}

function Entry({ entry }: EntryProps) {
  return (
    <div>
      <strong>{entry.creator.username}: </strong>{entry.text}
    </div>
  );
}

export default function Timeline({ authenticatedUserId }: TimelineProps) {
  const [entries, updateEntries] = useState<Entry[]>();

  useEffect(() => {
    async function getTimeline() {
      const timelineResponse = await fetch(`/api/users/${authenticatedUserId}/timeline`);
      const entries = await timelineResponse.json();
      updateEntries(entries.reverse());
    }

    getTimeline();
  }, [authenticatedUserId]);

  useEffect(() => {
    const socket = io();
    socket.emit('join', { userId: authenticatedUserId});

    socket.on('entry', (entry: Entry) => {
      updateEntries((entries) => {
        if (!entries) return [entry];
        return [entry, ...entries];
      });
    });

    return function() {
      socket.disconnect();
    }
  }, [authenticatedUserId]);

  if (!entries) return <div>Loading...</div>
  if (entries.length < 1) return <div>Empty timeline :( Follow some people!</div>

  return (
    <div>
      {entries.map(entry => <Entry entry={entry} key={entry.id} />)}
    </div>
  )
}
