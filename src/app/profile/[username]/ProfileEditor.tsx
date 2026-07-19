"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileEditor({
  initialBio,
  initialDiscord,
  initialGithub,
  initialYoutube,
  pendingUsername,
  verified,
  pendingVerification,
}: {
  initialBio: string;
  initialDiscord: string;
  initialGithub: string;
  initialYoutube: string;
  pendingUsername: string | null;
  verified: boolean;
  pendingVerification: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Username change request state
  const [nameOpen, setNameOpen] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSent, setNameSent] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  // Verification request state
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifySent, setVerifySent] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/profile", { method: "PATCH", body: form });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Update failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function requestUsername(event: React.FormEvent) {
    event.preventDefault();
    setNameError(null);
    setBusy(true);
    const res = await fetch("/api/profile/username-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newUsername }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setNameError(data.error ?? "Request failed");
      return;
    }
    setNameSent(true);
    setNameOpen(false);
    router.refresh();
  }

  async function requestVerification(event: React.FormEvent) {
    event.preventDefault();
    setVerifyError(null);
    setBusy(true);
    const res = await fetch("/api/profile/verification-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: verifyMessage }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setVerifyError(data.error ?? "Request failed");
      return;
    }
    setVerifySent(true);
    setVerifyOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {!open && (
          <button onClick={() => setOpen(true)} className="btn-ghost">
            ⚙ Edit Profile
          </button>
        )}
        {!nameOpen && !pendingUsername && !nameSent && (
          <button onClick={() => setNameOpen(true)} className="btn-ghost">
            ✎ Request Username Change
          </button>
        )}
        {!verified && !verifyOpen && !pendingVerification && !verifySent && (
          <button onClick={() => setVerifyOpen(true)} className="btn-secondary">
            ✔ Request Verification
          </button>
        )}
      </div>

      {(pendingUsername || nameSent) && (
        <p className="font-mono text-xs text-hud">
          ⏳ Username change request pending Owner approval
          {pendingUsername ? ` (→ ${pendingUsername})` : ""}
        </p>
      )}
      {(pendingVerification || verifySent) && !verified && (
        <p className="font-mono text-xs text-radar">
          ⏳ Verification request pending Owner approval
        </p>
      )}

      {verifyOpen && (
        <form onSubmit={requestVerification} className="card space-y-3 p-6">
          <div>
            <label className="label" htmlFor="verifyMessage">
              Why should you be verified?
            </label>
            <textarea
              id="verifyMessage"
              value={verifyMessage}
              onChange={(e) => setVerifyMessage(e.target.value)}
              className="input min-h-20"
              maxLength={1000}
              placeholder="Tell the Owner about your mods, experience and links to your work…"
            />
            <p className="mt-1 text-xs text-muted">
              Verified Developers get a blue badge and appear as trusted mod
              creators. Approval is at the Owner&apos;s discretion.
            </p>
          </div>
          {verifyError && <p className="text-sm text-danger">{verifyError}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Sending…" : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={() => setVerifyOpen(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {nameOpen && (
        <form onSubmit={requestUsername} className="card space-y-3 p-6">
          <div>
            <label className="label" htmlFor="newUsername">
              Requested Username
            </label>
            <input
              id="newUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="input"
              minLength={3}
              maxLength={24}
              pattern="[a-zA-Z0-9_\-]+"
              title="Letters, numbers, _ and - only"
              required
            />
            <p className="mt-1 text-xs text-muted">
              Username changes require approval by the site Owner.
            </p>
          </div>
          {nameError && <p className="text-sm text-danger">{nameError}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Sending…" : "Submit Request"}
            </button>
            <button type="button" onClick={() => setNameOpen(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {open && (
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="avatar">
              Profile Picture (PNG/JPEG/WebP, max 5 MB)
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={initialBio}
              className="input min-h-24"
              maxLength={500}
              placeholder="Tell the squadron about yourself…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="discordUrl">Discord URL</label>
              <input
                id="discordUrl"
                name="discordUrl"
                type="url"
                defaultValue={initialDiscord}
                className="input"
                placeholder="https://discord.gg/…"
              />
            </div>
            <div>
              <label className="label" htmlFor="githubUrl">GitHub URL</label>
              <input
                id="githubUrl"
                name="githubUrl"
                type="url"
                defaultValue={initialGithub}
                className="input"
                placeholder="https://github.com/…"
              />
            </div>
            <div>
              <label className="label" htmlFor="youtubeUrl">YouTube URL</label>
              <input
                id="youtubeUrl"
                name="youtubeUrl"
                type="url"
                defaultValue={initialYoutube}
                className="input"
                placeholder="https://youtube.com/@…"
              />
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
