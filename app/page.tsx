// app/page.tsx
import FeedbackForm from "./components/FeedbackForm";
import Image from "next/image";
import ResultsAccessButton from "./components/ResultsAccessButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f0f4f8] py-12 px-4">
      {/* HEADER SECTION */}
      <div className="max-w-3xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-center gap-6">
        
        {/* Logo Nakamura */}
        <div className="bg-white p-3 rounded-2xl shadow-sm">
          <Image
            src="/logo-nakamura.png"
            alt="Nakamura School Logo"
            width={80}
            height={80}
            className="object-contain"
            priority
          />
        </div>

        {/* Teks Judul */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-[#0a72b5] mb-1">
            Nakamura School
          </h1>
          <p className="text-gray-600 font-medium">
            Teacher Performance Feedback
          </p>
        </div>

      </div>
      
      {/* FORM SECTION */}
      <FeedbackForm />

      {/* FOOTER / WATERMARK */}
      <footer className="max-w-3xl mx-auto mt-10 pt-6 border-t border-slate-200 text-center select-none">
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-[#0a72b5]">@ Erick Sensei</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          © 2026 Nakamura School · Teacher Performance Feedback
        </p>
      </footer>

      {/* Bottom-right button → password pop-up → /results */}
      <ResultsAccessButton />
    </main>
  );
}