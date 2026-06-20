import React, { useState } from 'react';
import HskRightPanel from './HskRightPanel';

export default function ReceptionHskPanel({ currentUser, userProfile }) {
  const [open, setOpen] = useState(true);

  const user = {
    uid: currentUser?.uid,
    displayName: userProfile?.displayName || currentUser?.displayName,
    email: currentUser?.email,
  };

  return (
    <div className="hsk-reception-wrap">
      <HskRightPanel
        user={user}
        role="reception"
        canManageRooms
        collapsed={!open}
        onToggleCollapse={() => setOpen((o) => !o)}
      />
    </div>
  );
}
