// app/results/page.tsx — password-protected results area
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { hasResultsAccess } from "@/lib/results-auth";
import ResultsView from "./ResultsView";

export const metadata: Metadata = {
  title: "Results - Nakamura School Feedback",
  robots: { index: false, follow: false },
};

export default function ResultsPage() {
  return (
    <main className="results-page min-h-screen bg-[#f0f4f8] py-12 px-4">
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            <Image src="/logo-nakamura.png" alt="Nakamura School Logo" width={64} height={64} className="object-contain" priority />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-[#0a72b5] mb-1">Feedback Results</h1>
            <p className="text-gray-600 font-medium">Nakamura School · Teacher Performance Feedback</p>
          </div>
        </div>
      </div>

      {/* Cookies are read inside Suspense (required with cacheComponents) */}
      <Suspense fallback={<p className="max-w-5xl mx-auto text-center text-slate-400">Loading…</p>}>
        <ResultsGate />
      </Suspense>

      <footer className="max-w-5xl mx-auto mt-10 pt-6 border-t border-slate-200 text-center select-none">
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-[#0a72b5]">@ Erick Sensei</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">© 2026 Nakamura School · Teacher Performance Feedback</p>
      </footer>
    </main>
  );
}

async function ResultsGate() {
  if (!(await hasResultsAccess())) redirect("/");

  return (
    <div className="max-w-5xl mx-auto">
      <ResultsView />
    </div>
  );
}
