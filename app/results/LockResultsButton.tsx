"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { lockResults } from "@/app/actions/resultsAuth";

/** Logs out of the results area and goes back to the form. */
export default function LockResultsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await lockResults();
        router.replace("/");
      }}
      className="rv-lock-btn"
    >
      🔒 {loading ? "Locking…" : "Lock & Back to Form"}
    </button>
  );
}
