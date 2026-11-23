"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { unlockResults } from "@/app/actions/resultsAuth";

/** Floating button (bottom-right) → password pop-up → /results */
export default function ResultsAccessButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function close() {
    if (loading) return;
    setOpen(false);
    setPassword("");
    setError(null);
    setShowPw(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return setError("Please enter the password.");
    setLoading(true);
    setError(null);
    const res = await unlockResults(password);
    if (res.success) {
      router.push("/results");
      return; // keep the spinner while navigating
    }
    setLoading(false);
    setError(res.error ?? "Something went wrong.");
    setPassword("");
    inputRef.current?.focus();
  }

  return (
    <>
      <style>{`
        .ra-fab {
          position: fixed; right: 1.5rem; bottom: 1.5rem; z-index: 40;
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.8rem 1.2rem; border: none; border-radius: 999px;
          background: #0a72b5; color: #fff; font-weight: 600; font-size: 0.95rem;
          font-family: inherit; cursor: pointer;
          box-shadow: 0 8px 24px rgba(10, 114, 181, 0.35);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .ra-fab:hover { background: #085a91; transform: translateY(-2px); }
        .ra-fab svg { width: 18px; height: 18px; }
        @media (max-width: 600px) { .ra-fab-label { display: none; } .ra-fab { padding: 0.9rem; } }

        .ra-backdrop {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
          animation: ra-fade 0.15s ease;
        }
        .ra-modal {
          width: 100%; max-width: 400px; background: #fff; border-radius: 16px;
          border-top: 6px solid #0a72b5; padding: 2rem;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          animation: ra-pop 0.18s ease;
        }
        .ra-icon {
          width: 48px; height: 48px; border-radius: 12px; margin-bottom: 1rem;
          display: flex; align-items: center; justify-content: center;
          background: rgba(10, 114, 181, 0.1); color: #0a72b5;
        }
        .ra-icon svg { width: 24px; height: 24px; }
        .ra-title { font-size: 1.3rem; font-weight: 700; color: #0a72b5; margin: 0 0 0.25rem; }
        .ra-sub { font-size: 0.9rem; color: #64748b; margin: 0 0 1.25rem; }
        .ra-field { position: relative; }
        .ra-input {
          width: 100%; box-sizing: border-box; padding: 0.75rem 3.5rem 0.75rem 1rem;
          border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; font-family: inherit;
          background: #f8fafc; color: #1e293b; outline: none; transition: all 0.2s ease;
        }
        .ra-input:focus { border-color: #0a72b5; background: #fff; box-shadow: 0 0 0 3px rgba(10,114,181,0.15); }
        .ra-input.ra-invalid { border-color: #d9232d; }
        .ra-toggle {
          position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
          border: none; background: transparent; color: #64748b; font-size: 0.8rem;
          font-weight: 600; cursor: pointer; padding: 0.35rem 0.5rem; border-radius: 6px; font-family: inherit;
        }
        .ra-toggle:hover { background: #e2e8f0; }
        .ra-error { color: #d9232d; font-size: 0.85rem; font-weight: 500; margin: 0.5rem 0 0; }
        .ra-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem; }
        .ra-btn {
          padding: 0.7rem 1.3rem; border-radius: 8px; border: none; font-weight: 600;
          font-size: 0.95rem; cursor: pointer; font-family: inherit; transition: background 0.15s ease;
        }
        .ra-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .ra-cancel { background: #e2e8f0; color: #475569; }
        .ra-cancel:hover:not(:disabled) { background: #cbd5e1; }
        .ra-submit { background: #0a72b5; color: #fff; }
        .ra-submit:hover:not(:disabled) { background: #085a91; }
        @keyframes ra-fade { from { opacity: 0; } }
        @keyframes ra-pop { from { opacity: 0; transform: scale(0.95) translateY(8px); } }
      `}</style>

      <button type="button" className="ra-fab" onClick={() => setOpen(true)} aria-label="View results">
        <LockIcon />
        <span className="ra-fab-label">View Results</span>
      </button>

      {open && (
        <div className="ra-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className="ra-modal" role="dialog" aria-modal="true" aria-labelledby="ra-title">
            <div className="ra-icon"><LockIcon /></div>
            <h2 id="ra-title" className="ra-title">Results Access</h2>
            <p className="ra-sub">This area is restricted. Enter the password to view the feedback results.</p>

            <form onSubmit={onSubmit}>
              <div className="ra-field">
                <input
                  ref={inputRef}
                  type={showPw ? "text" : "password"}
                  className={`ra-input${error ? " ra-invalid" : ""}`}
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                />
                <button type="button" className="ra-toggle" onClick={() => setShowPw((s) => !s)} tabIndex={-1}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              {error && <p className="ra-error">{error}</p>}

              <div className="ra-actions">
                <button type="button" className="ra-btn ra-cancel" onClick={close} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="ra-btn ra-submit" disabled={loading}>
                  {loading ? "Checking…" : "Enter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
