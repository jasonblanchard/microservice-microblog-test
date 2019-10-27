import React, { useState, useEffect } from 'react';

interface TimelineProps {
  authenticatedUserId: number;
}

interface Entry {
  id: number;
  text: string;
}

interface EntryProps {
  entry: Entry;
}

function Entry({ entry }: EntryProps) {
  return (
    <div>
      {entry.text}
    </div>
  );
}

export default function Timeline({ authenticatedUserId }: TimelineProps) {
  const [entries, updateEntries] = useState<[Entry]>();

  useEffect(() => {
    async function getTimeline() {
      const timelineResponse = await fetch(`/api/users/${authenticatedUserId}/timeline`);
      const entries = await timelineResponse.json();
      updateEntries(entries);
    }

    getTimeline();
  }, [authenticatedUserId]);

  if (!entries) return <div>Loading...</div>
  if (entries.length < 1) return <div>Empty timeline :( Follow some people!</div>

  return (
    <div>
      {entries.reverse().map(entry => <Entry entry={entry} key={entry.id} />)}
    </div>
  )
}
