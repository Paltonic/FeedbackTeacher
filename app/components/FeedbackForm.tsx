"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackSchema, FeedbackFormData } from "@/lib/schemas/feedback";
import { submitFeedback } from "@/app/actions/submitFeedback";

type Step = "personal" | "professional" | "pedagogical" | "social" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "personal", label: "Personal Info" },
  { key: "professional", label: "Professional" },
  { key: "pedagogical", label: "Pedagogical" },
  { key: "social", label: "Social" },
  { key: "review", label: "Review" },
];

const RATING_OPTIONS = [
  { value: "1", label: "1 - Never" },
  { value: "2", label: "2 - Rarely" },
  { value: "3", label: "3 - Often" },
  { value: "4", label: "4 - Always" },
];

export default function FeedbackForm() {
  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    mode: "onTouched",
    defaultValues: {
      professional1: "1", professional2: "1", professional3: "1",
      professional4: "1", professional5: "1", professional6: "1",
      pedagogical1: "1", pedagogical2: "1", pedagogical3: "1",
      pedagogical4: "1", pedagogical5: "1", pedagogical6: "1",
      social1: "1", social2: "1", social3: "1", social4: "1",
      social5: "1", social6: "1", social7: "1",
    },
  });

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return;

    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].key);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].key);
    }
  };

  const getFieldsForStep = (step: Step): (keyof FeedbackFormData)[] => {
    switch (step) {
      case "personal": return ["name", "class", "teacherName"];
      case "professional": return ["professional1", "professional2", "professional3", "professional4", "professional5", "professional6"];
      case "pedagogical": return ["pedagogical1", "pedagogical2", "pedagogical3", "pedagogical4", "pedagogical5", "pedagogical6"];
      case "social": return ["social1", "social2", "social3", "social4", "social5", "social6", "social7"];
      default: return [];
    }
  };

  const onSubmit = async (data: FeedbackFormData) => {
    setSubmitMessage(null);
    const result = await submitFeedback(data);
    if (result.success) {
      setSubmitMessage("✅ Thank you! Your feedback has been submitted.");
    } else {
      setSubmitMessage("❌ Something went wrong. Please try again.");
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="nakamura-form-container">
      {/* CSS VANILLA DISISIPKAN DI SINI */}
      <style>{`
        .nakamura-form-container {
          max-width: 800px;
          margin: 2rem auto;
          padding: 2.5rem;
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(10, 114, 181, 0.08);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1e293b;
          border-top: 6px solid #0a72b5;
        }

        /* Stepper */
        .stepper {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3rem;
          position: relative;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          z-index: 2;
        }
        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
          background-color: #e2e8f0;
          color: #64748b;
          transition: all 0.3s ease;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 2px #e2e8f0;
        }
        .step-circle.active {
          background-color: #d9232d;
          color: #ffffff;
          box-shadow: 0 0 0 2px #d9232d;
          transform: scale(1.1);
        }
        .step-circle.completed {
          background-color: #2ba6df;
          color: #ffffff;
          box-shadow: 0 0 0 2px #2ba6df;
        }
        .step-label {
          font-size: 0.75rem;
          margin-top: 0.5rem;
          color: #64748b;
          font-weight: 600;
          text-align: center;
        }
        .step-label.active {
          color: #d9232d;
        }

        /* Typography */
        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0a72b5;
          margin-bottom: 0.5rem;
        }
        .section-subtitle {
          font-size: 0.9rem;
          color: #64748b;
          margin-bottom: 1.5rem;
        }

        /* Form Groups */
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #334155;
          font-size: 0.95rem;
        }
        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 1rem;
          color: #1e293b;
          background-color: #f8fafc;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }
        .form-input:focus, .form-textarea:focus {
          border-color: #0a72b5;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(10, 114, 181, 0.15);
        }
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        .error-text {
          color: #d9232d;
          font-size: 0.85rem;
          margin-top: 0.25rem;
          font-weight: 500;
        }

        /* Questions */
        .question-block {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .question-text {
          font-weight: 500;
          margin-bottom: 0.75rem;
          color: #1e293b;
          line-height: 1.5;
        }
        .radio-group {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.95rem;
          color: #475569;
        }
        .radio-input {
          width: 18px;
          height: 18px;
          accent-color: #0a72b5;
          cursor: pointer;
        }

        /* Buttons */
        .button-group {
          display: flex;
          justify-content: space-between;
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-family: inherit;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-prev {
          background-color: #e2e8f0;
          color: #475569;
        }
        .btn-prev:hover:not(:disabled) {
          background-color: #cbd5e1;
        }
        .btn-next {
          background-color: #0a72b5;
          color: #ffffff;
          margin-left: auto;
        }
        .btn-next:hover:not(:disabled) {
          background-color: #085a91;
        }
        .btn-submit {
          background-color: #d9232d;
          color: #ffffff;
          margin-left: auto;
        }
        .btn-submit:hover:not(:disabled) {
          background-color: #b51a22;
        }

        /* Alerts */
        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1.5rem;
          font-weight: 500;
        }
        .alert-success {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .alert-error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
      `}</style>
      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.key;
          const isCompleted = index < currentStepIndex;
          
          return (
            <div key={step.key} className="step-item">
              <div className={`step-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                {index + 1}
              </div>
              <span className={`step-label ${isActive ? "active" : ""}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Personal Info */}
        {currentStep === "personal" && (
          <section>
            <h2 className="section-title">Personal Information</h2>
            <p className="section-subtitle">Please fill in your details below.</p>
            
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input {...register("name")} className="form-input" placeholder="Your full name" />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Class *</label>
              <input {...register("class")} className="form-input" placeholder="Your class (e.g., 10A)" />
              {errors.class && <p className="error-text">{errors.class.message}</p>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Teacher Name *</label>
              <input {...register("teacherName")} className="form-input" placeholder="Name of the teacher" />
              {errors.teacherName && <p className="error-text">{errors.teacherName.message}</p>}
            </div>
          </section>
        )}

        {/* Step 2: Professional Competence */}
        {currentStep === "professional" && (
          <section>
            <h2 className="section-title">Professional Competence</h2>
            <p className="section-subtitle">Rating scale: 1 = Never, 2 = Rarely, 3 = Often, 4 = Always</p>
            
            <RatingQuestion question="The teacher has a strong command of the subject and answers students' questions accurately." name="professional1" control={control} error={errors.professional1} />
            <RatingQuestion question="The teacher connects the lesson to real-life examples." name="professional2" control={control} error={errors.professional2} />
            <RatingQuestion question="The teacher uses learning media (books, videos, slides, apps, etc.) to support the lesson." name="professional3" control={control} error={errors.professional3} />
            <RatingQuestion question="The teacher shares recent or relevant information that broadens students' knowledge." name="professional4" control={control} error={errors.professional4} />
            <RatingQuestion question="The teacher shows enthusiasm and passion when teaching this subject." name="professional5" control={control} error={errors.professional5} />
            <RatingQuestion question="The way the teacher explains makes me curious and excited to learn more." name="professional6" control={control} error={errors.professional6} />
            
            <div className="form-group">
              <label className="form-label">Any other suggestions related to your teacher's mastery of the subject?</label>
              <textarea {...register("professionalSuggestion")} className="form-textarea" placeholder="Optional feedback" />
            </div>
          </section>
        )}

        {/* Step 3: Pedagogical Competence */}
        {currentStep === "pedagogical" && (
          <section>
            <h2 className="section-title">Pedagogical Competence</h2>
            <p className="section-subtitle">Rating scale: 1 = Never, 2 = Rarely, 3 = Often, 4 = Always</p>

            <RatingQuestion question="The teacher uses a variety of teaching methods so lessons are not boring." name="pedagogical1" control={control} error={errors.pedagogical1} />
            <RatingQuestion question="The teacher gives students opportunities to ask questions, share opinions, and discuss." name="pedagogical2" control={control} error={errors.pedagogical2} />
            <RatingQuestion question="The teacher gives fair assessments that match the material and returns them with feedback." name="pedagogical3" control={control} error={errors.pedagogical3} />
            <RatingQuestion question="The teacher helps and pays attention to students who have difficulty learning." name="pedagogical4" control={control} error={errors.pedagogical4} />
            <RatingQuestion question="Learning activities in this class are fun and engaging." name="pedagogical5" control={control} error={errors.pedagogical5} />
            <RatingQuestion question="I feel happy and motivated to attend this teacher's class." name="pedagogical6" control={control} error={errors.pedagogical6} />
            
            <div className="form-group">
              <label className="form-label">Any other suggestions related to how your teacher teaches, gives assignments, or provides feedback?</label>
              <textarea {...register("pedagogicalSuggestion")} className="form-textarea" placeholder="Optional feedback" />
            </div>
          </section>
        )}

        {/* Step 4: Social Competence */}
        {currentStep === "social" && (
          <section>
            <h2 className="section-title">Social Competence</h2>
            <p className="section-subtitle">Rating scale: 1 = Never, 2 = Rarely, 3 = Often, 4 = Always</p>

            <RatingQuestion question="The teacher is friendly, polite, and respectful to all students without discrimination." name="social1" control={control} error={errors.social1} />
            <RatingQuestion question="The teacher communicates using polite and easy-to-understand language." name="social2" control={control} error={errors.social2} />
            <RatingQuestion question="The teacher creates a comfortable, safe, and supportive classroom atmosphere." name="social3" control={control} error={errors.social3} />
            <RatingQuestion question="The teacher cooperates and interacts well with students and other school members." name="social4" control={control} error={errors.social4} />
            <RatingQuestion question="The teacher uses humor and a warm manner that makes the classroom atmosphere cheerful." name="social5" control={control} error={errors.social5} />
            <RatingQuestion question="The teacher handles conflicts or misbehavior fairly, calmly, and without humiliating students." name="social6" control={control} error={errors.social6} />
            <RatingQuestion question="The teacher encourages respect, teamwork, and tolerance among students." name="social7" control={control} error={errors.social7} />
            
            <div className="form-group">
              <label className="form-label">Any other suggestions related to how your teacher communicates and interacts with students?</label>
              <textarea {...register("socialSuggestion")} className="form-textarea" placeholder="Optional feedback" />
            </div>
          </section>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === "review" && (
          <section>
            <h2 className="section-title">Review Your Feedback</h2>
            <p className="section-subtitle">Please make sure all your answers are correct before submitting.</p>
            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', margin: 0 }}>
                You have completed all sections. Click "Submit Feedback" to send your responses.
              </p>
            </div>
          </section>
        )}

        {/* Navigation Buttons */}
        <div className="button-group">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === "personal"}
            className="btn btn-prev"
          >
            Previous
          </button>

          {currentStep !== "review" ? (
            <button type="button" onClick={nextStep} className="btn btn-next">
              Next
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="btn btn-submit">
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          )}
        </div>

        {/* Messages */}
        {submitMessage && (
          <div className={`alert ${submitMessage.includes("✅") ? "alert-success" : "alert-error"}`}>
            {submitMessage}
          </div>
        )}
      </form>
    </div>
  );
}

// Helper Component for Rating Questions
function RatingQuestion({ question, name, control, error }: { question: string; name: keyof FeedbackFormData; control: any; error?: any; }) {
  return (
    <div className="question-block">
      <p className="question-text">{question}</p>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="radio-group">
            {RATING_OPTIONS.map((opt) => (
              <label key={opt.value} className="radio-label">
                <input
                  type="radio"
                  value={opt.value}
                  checked={field.value === opt.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  className="radio-input"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      />
      {error && <p className="error-text">{error.message}</p>}
    </div>
  );
}