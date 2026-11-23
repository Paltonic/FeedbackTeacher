// Question list for the results page. Keep the texts in sync with app/components/FeedbackForm.tsx.

export type CategoryKey = "professional" | "pedagogical" | "social";
export type Question = { id: string; text: string };
export type Category = { key: CategoryKey; title: string; questions: Question[] };

export const CATEGORIES: Category[] = [
  {
    key: "professional",
    title: "Professional Competence",
    questions: [
      { id: "professional1", text: "The teacher has a strong command of the subject and answers students' questions accurately." },
      { id: "professional2", text: "The teacher connects the lesson to real-life examples." },
      { id: "professional3", text: "The teacher uses learning media (books, videos, slides, apps, etc.) to support the lesson." },
      { id: "professional4", text: "The teacher shares recent or relevant information that broadens students' knowledge." },
      { id: "professional5", text: "The teacher shows enthusiasm and passion when teaching this subject." },
      { id: "professional6", text: "The way the teacher explains makes me curious and excited to learn more." },
    ],
  },
  {
    key: "pedagogical",
    title: "Pedagogical Competence",
    questions: [
      { id: "pedagogical1", text: "The teacher uses a variety of teaching methods so lessons are not boring." },
      { id: "pedagogical2", text: "The teacher gives students opportunities to ask questions, share opinions, and discuss." },
      { id: "pedagogical3", text: "The teacher gives fair assessments that match the material and returns them with feedback." },
      { id: "pedagogical4", text: "The teacher helps and pays attention to students who have difficulty learning." },
      { id: "pedagogical5", text: "Learning activities in this class are fun and engaging." },
      { id: "pedagogical6", text: "I feel happy and motivated to attend this teacher's class." },
    ],
  },
  {
    key: "social",
    title: "Social Competence",
    questions: [
      { id: "social1", text: "The teacher is friendly, polite, and respectful to all students without discrimination." },
      { id: "social2", text: "The teacher communicates using polite and easy-to-understand language." },
      { id: "social3", text: "The teacher creates a comfortable, safe, and supportive classroom atmosphere." },
      { id: "social4", text: "The teacher cooperates and interacts well with students and other school members." },
      { id: "social5", text: "The teacher uses humor and a warm manner that makes the classroom atmosphere cheerful." },
      { id: "social6", text: "The teacher handles conflicts or misbehavior fairly, calmly, and without humiliating students." },
      { id: "social7", text: "The teacher encourages respect, teamwork, and tolerance among students." },
    ],
  },
];
