"use client";

import { useState } from "react";

export function FollowButton({
  userId,
  initialFollowing,
  initialCount,
}: {
  userId: string;
  initialFollowing: boolean;
  initialCount: number;
}) {
  const [state, setState] = useState({
    following: initialFollowing,
    count: initialCount,
  });
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setState({ following: data.following, count: data.count });
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={state.following ? "btn-ghost" : "btn-primary"}
    >
      {state.following ? "✓ Following" : "+ Follow Developer"}
      <span className="font-mono text-xs opacity-80">({state.count})</span>
    </button>
  );
}
