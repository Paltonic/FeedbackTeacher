// app/page.tsx
import FeedbackForm from "./components/FeedbackForm";
import Image from "next/image";

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
    </main>
  );
}