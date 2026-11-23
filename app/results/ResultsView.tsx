"use client";

import { useEffect, useState } from "react";
import SearchableSelect from "@/app/components/SearchableSelect";
import LockResultsButton from "./LockResultsButton";
import {
  getResultsTeachers,
  getTeacherResults,
  type TeacherResults,
  type RatingKey,
} from "@/app/actions/getTeacherResults";

// Rating scale colours: red (1) → blue (4)
const RATINGS: { key: RatingKey; label: string; color: string; ink: string }[] = [
  { key: 1, label: "1 Never", color: "#d9232d", ink: "#ffffff" },
  { key: 2, label: "2 Rarely", color: "#f19a9f", ink: "#7f1d1d" },
  { key: 3, label: "3 Often", color: "#7cc0e8", ink: "#0c3d5e" },
  { key: 4, label: "4 Always", color: "#0a72b5", ink: "#ffffff" },
];

function Legend() {
  return (
    <div className="rv-legend" aria-label="Rating legend">
      {RATINGS.map((r) => (
        <span key={r.key} className="rv-legend-item">
          <span className="rv-swatch" style={{ background: r.color }} />
          {r.label}
        </span>
      ))}
    </div>
  );
}

export default function ResultsView() {
  const [teachers, setTeachers] = useState<string[] | null>(null);
  const [teacher, setTeacher] = useState("");
  const [results, setResults] = useState<TeacherResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getResultsTeachers()
      .then(setTeachers)
      .catch(() => setError("Failed to load teachers. Please refresh the page."));
  }, []);

  useEffect(() => {
    if (!teacher) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTeacherResults(teacher)
      .then((r) => !cancelled && setResults(r))
      .catch(() => !cancelled && setError("Failed to load results. Your access may have expired — please unlock again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [teacher]);

  function printReport() {
    if (!results) return;
    // The PDF file name comes from the page title
    const original = document.title;
    document.title = `Feedback Results - ${results.teacherName}`;
    const restore = () => {
      document.title = original;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  const canPrint = !!results && results.responses > 0 && !loading;

  const printedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="rv">
      <style>{CSS}</style>

      {/* Toolbar — Print is always visible, enabled once results are shown */}
      <div className="rv-toolbar no-print">
        <LockResultsButton />
        <button
          type="button"
          className="rv-print-btn"
          onClick={printReport}
          disabled={!canPrint}
          title={canPrint ? "Print or save this report as PDF" : "Choose a teacher with responses first"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print / Save as PDF
        </button>
      </div>

      {/* Teacher picker (hidden on paper) */}
      <div className="rv-card rv-picker no-print">
        <label className="form-label">Teacher Name</label>
        <SearchableSelect
          options={teachers ?? []}
          value={teacher}
          onChange={setTeacher}
          disabled={!teachers}
          disabledPlaceholder="Loading…"
          placeholder="Type to search teacher name"
          emptyText="Teacher not found"
        />
        <p className="rv-hint">
          Each question shows the share of every rating (1–4). Overall scores show the share of <b>3 (Often)</b> and <b>4 (Always)</b>.
        </p>
      </div>

      {error && <p className="rv-error">{error}</p>}
      {loading && <p className="rv-muted rv-center">Loading results…</p>}

      {!loading && results && results.responses === 0 && (
        <div className="rv-card rv-center">
          <p className="rv-empty-title">No feedback yet for {results.teacherName}</p>
          <p className="rv-muted">Results will appear once students submit the form.</p>
        </div>
      )}

      {!loading && results && results.responses > 0 && (
        <>
          {/* Report heading — only on paper */}
          <div className="rv-print-head">
            <h2>Teacher: {results.teacherName}</h2>
            <p>
              {results.responses} responses · Per question: share of each rating 1–4 · Overall: share of 3 (Often) + 4 (Always) · Printed {printedOn}
            </p>
          </div>

          {/* Summary tiles */}
          <div className="rv-tiles">
            <div className="rv-card rv-tile">
              <p className="rv-tile-label">Responses</p>
              <p className="rv-tile-value">{results.responses}</p>
              <p className="rv-muted">students rated {results.teacherName}</p>
            </div>
            {results.categories.map((c) => (
              <a key={c.key} href={`#cat-${c.key}`} className="rv-card rv-tile rv-tile-link">
                <p className="rv-tile-label">{c.title.replace(" Competence", "")}</p>
                <p className="rv-tile-value">{c.percent}%</p>
                <p className="rv-tile-sub">rated 3–4 (Often / Always)</p>
                <p className="rv-muted">
                  {c.positive}/{c.total} answers
                </p>
              </a>
            ))}
          </div>

          {/* One bar chart per category */}
          {results.categories.map((c) => (
            <section key={c.key} id={`cat-${c.key}`} className="rv-card">
              <div className="rv-cat-head">
                <h2 className="rv-cat-title">{c.title}</h2>
                <span className="rv-cat-pct">
                  Overall <b>{c.percent}%</b> rated 3–4
                </span>
              </div>

              <div className="rv-keep">
                <Legend />
                <ul className="rv-bars">
                  {c.questions.map((q) => (
                    <li key={q.id} className="rv-row" tabIndex={0}>
                      <div className="rv-q">
                        <span className="rv-qnum">Q{q.number}</span>
                        <span className="rv-qtext">{q.text}</span>
                      </div>
                      <div className="rv-bar-line">
                        <div className="rv-stack" role="img" aria-label={RATINGS.map((r) => `${r.label}: ${q.percents[r.key]}%`).join(", ")}>
                          {q.total === 0 ? (
                            <div className="rv-stack-empty">No answers</div>
                          ) : (
                            RATINGS.filter((r) => q.counts[r.key] > 0).map((r) => (
                              <div
                                key={r.key}
                                className="rv-seg"
                                style={{ flexGrow: q.counts[r.key], background: r.color, color: r.ink }}
                                title={`${r.label}: ${q.counts[r.key]} of ${q.total} (${q.percents[r.key]}%)`}
                              >
                                {q.percents[r.key] >= 8 && <span>{Math.round(q.percents[r.key])}%</span>}
                              </div>
                            ))
                          )}
                        </div>
                        <span className="rv-val">n = {q.total}</span>
                      </div>
                      {/* Exact numbers for every rating (also printed) */}
                      <div className="rv-breakdown">
                        {RATINGS.map((r) => (
                          <span key={r.key}>
                            <span className="rv-dot" style={{ background: r.color }} />
                            {r.key}: <b>{q.percents[r.key]}%</b> <span className="rv-muted">({q.counts[r.key]})</span>
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Students' comments for this category */}
              <div className="rv-comments">
                <h3 className="rv-comments-title">
                  Student Comments <span className="rv-muted">({c.comments.length})</span>
                </h3>
                {c.comments.length === 0 ? (
                  <p className="rv-muted rv-no-comments">No comments for this category.</p>
                ) : (
                  <ol className="rv-comment-list">
                    {c.comments.map((text, i) => (
                      <li key={i} className="rv-comment">
                        {text}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

const CSS = `
  .rv { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; }
  .rv-card {
    background: #fff; border-radius: 16px; padding: 1.75rem; margin-bottom: 1.25rem;
    box-shadow: 0 10px 30px rgba(10, 114, 181, 0.08);
  }
  .rv-picker { border-top: 6px solid #0a72b5; }
  .rv-hint { font-size: 0.85rem; color: #64748b; margin: 0.75rem 0 0; }
  .rv-muted { color: #64748b; font-size: 0.85rem; margin: 0; }
  .rv-center { text-align: center; }
  .rv-error {
    background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;
    padding: 1rem; border-radius: 8px; font-weight: 500;
  }
  .rv-empty-title { font-weight: 600; font-size: 1.1rem; margin: 0 0 0.25rem; }

  /* Tiles */
  .rv-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
  @media (max-width: 800px) { .rv-tiles { grid-template-columns: repeat(2, 1fr); } }
  .rv-tiles .rv-card { margin-bottom: 0; padding: 1.25rem; }
  .rv-tile-link { text-decoration: none; color: inherit; transition: transform 0.15s ease; }
  .rv-tile-link:hover { transform: translateY(-2px); }
  .rv-tile-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; margin: 0; }
  .rv-tile-value { font-size: 2rem; font-weight: 700; color: #0f172a; margin: 0.25rem 0; }

  /* Category chart */
  .rv-cat-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .rv-cat-title { font-size: 1.3rem; font-weight: 700; color: #0a72b5; margin: 0; }
  .rv-cat-pct { font-size: 0.9rem; font-weight: 600; color: #475569; }
  .rv-bars { list-style: none; margin: 0; padding: 0; }
  .rv-row { position: relative; padding: 0.6rem 0.5rem; margin: 0 -0.5rem; border-radius: 8px; outline: none; }
  .rv-row:hover, .rv-row:focus-visible { background: #f8fafc; }
  .rv-q { display: flex; gap: 0.6rem; margin-bottom: 0.4rem; font-size: 0.92rem; line-height: 1.4; }
  .rv-qnum { font-weight: 700; color: #0a72b5; flex-shrink: 0; min-width: 1.75rem; }
  .rv-qtext { color: #334155; }
  .rv-bar-line { display: flex; align-items: center; gap: 0.75rem; padding-left: 2.35rem; }
  .rv-tile-sub { font-size: 0.75rem; font-weight: 600; color: #0a72b5; margin: -0.15rem 0 0.2rem; }
  .rv-legend { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; margin: 0 0 0.75rem; font-size: 0.8rem; color: #475569; font-weight: 500; }
  .rv-legend-item { display: inline-flex; align-items: center; gap: 0.35rem; }
  .rv-swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  .rv-stack { flex: 1; display: flex; gap: 2px; height: 22px; border-radius: 4px; overflow: hidden; background: #fff; }
  .rv-seg {
    display: flex; align-items: center; justify-content: center; min-width: 3px;
    font-size: 0.72rem; font-weight: 700; flex-basis: 0; transition: flex-grow 0.5s ease;
  }
  .rv-stack-empty { flex: 1; background: #e2e8f0; color: #64748b; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; }
  .rv-breakdown { display: flex; flex-wrap: wrap; gap: 0.25rem 1.1rem; padding-left: 2.35rem; margin-top: 0.35rem; font-size: 0.78rem; color: #334155; }
  .rv-breakdown > span { display: inline-flex; align-items: center; gap: 0.3rem; }
  .rv-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .rv-val { min-width: 4.5rem; text-align: right; font-size: 0.8rem; color: #64748b; white-space: nowrap; }

  /* Hover / focus tooltip */
  .rv-tip {
    position: absolute; left: 50%; bottom: calc(100% - 0.25rem); transform: translateX(-50%);
    background: #0f172a; color: #fff; font-size: 0.8rem; padding: 0.45rem 0.7rem; border-radius: 6px;
    white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.12s ease; z-index: 5;
  }
  .rv-row:hover .rv-tip, .rv-row:focus-visible .rv-tip { opacity: 1; }
  @media (max-width: 600px) {
    .rv-bar-line, .rv-breakdown { padding-left: 0; }
    .rv-val { min-width: 6rem; }
    .rv-tip { display: none; }
  }

  /* Comments */
  .rv-comments { margin-top: 1.25rem; padding-top: 1.1rem; border-top: 1px solid #e2e8f0; }
  .rv-comments-title { font-size: 1rem; font-weight: 700; color: #334155; margin: 0 0 0.75rem; }
  .rv-comments-title .rv-muted { font-weight: 500; }
  .rv-no-comments { font-style: italic; }
  .rv-comment-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; counter-reset: c; }
  .rv-comment {
    counter-increment: c; position: relative; padding: 0.6rem 0.85rem 0.6rem 2.4rem;
    background: #f8fafc; border-left: 3px solid #2ba6df; border-radius: 0 8px 8px 0;
    font-size: 0.92rem; line-height: 1.5; color: #334155; white-space: pre-wrap; overflow-wrap: anywhere;
  }
  .rv-comment::before {
    content: counter(c) "."; position: absolute; left: 0.75rem; top: 0.6rem;
    font-weight: 700; color: #94a3b8; font-size: 0.85rem;
  }

  /* Print button */
  .rv-toolbar { display: flex; justify-content: flex-end; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .rv-lock-btn {
    display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.1rem; border-radius: 8px;
    background: #fff; border: 1px solid #cbd5e1; color: #475569; font-weight: 600; font-size: 0.95rem;
    font-family: inherit; cursor: pointer; transition: background 0.15s ease;
  }
  .rv-lock-btn:hover:not(:disabled) { background: #f1f5f9; }
  .rv-lock-btn:disabled { opacity: 0.6; cursor: wait; }
  .rv-print-btn {
    display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.2rem; border: none; border-radius: 8px;
    background: #0a72b5; color: #fff; font-weight: 600; font-size: 0.95rem; font-family: inherit; cursor: pointer;
    box-shadow: 0 4px 12px rgba(10, 114, 181, 0.25); transition: background 0.15s ease;
  }
  .rv-print-btn:hover:not(:disabled) { background: #085a91; }
  .rv-print-btn:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; }
  .rv-print-btn svg { width: 18px; height: 18px; }
  .rv-print-head { display: none; }

  /* ---------- Print / PDF layout ---------- */
  @media print {
    @page { size: A4; margin: 14mm 12mm; }
    html, body { background: #fff !important; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print, .ra-fab, .rv-tip { display: none !important; }
    .results-page { background: #fff !important; padding: 0 !important; min-height: 0 !important; }
    .results-page > div:first-child { margin-bottom: 0.75rem !important; }
    .rv-print-head { display: block; margin-bottom: 1rem; padding-bottom: 0.6rem; border-bottom: 2px solid #0a72b5; }
    .rv-print-head h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 0.2rem; }
    .rv-print-head p { font-size: 0.8rem; color: #475569; margin: 0; }
    .rv-card { box-shadow: none !important; border: 1px solid #e2e8f0; padding: 1rem 1.25rem; margin-bottom: 0.9rem; }
    .rv-tiles { grid-template-columns: repeat(4, 1fr) !important; gap: 0.6rem; margin-bottom: 0.9rem; }
    .rv-tiles .rv-card { padding: 0.75rem; }
    .rv-tile-link:hover { transform: none; }
    .rv-tile-value { font-size: 1.5rem; }
    .rv-cat-head { margin-bottom: 0.5rem; }
    .rv-cat-title { font-size: 1.1rem; }
    .rv-keep { break-inside: avoid; page-break-inside: avoid; }
    .rv-cat-head { break-after: avoid; page-break-after: avoid; }
    .rv-comments { margin-top: 0.75rem; padding-top: 0.6rem; }
    .rv-comments-title { font-size: 0.9rem; margin-bottom: 0.4rem; break-after: avoid; page-break-after: avoid; }
    .rv-comment-list { gap: 0.3rem; }
    .rv-comment { font-size: 0.8rem; padding: 0.35rem 0.6rem 0.35rem 2rem; break-inside: avoid; page-break-inside: avoid; }
    .rv-comment::before { top: 0.35rem; left: 0.6rem; font-size: 0.75rem; }
    .rv-row { padding: 0.35rem 0.5rem; break-inside: avoid; }
    .rv-row:hover { background: none; }
    .rv-q { font-size: 0.82rem; margin-bottom: 0.25rem; }
    .rv-bar-line { padding-left: 2.35rem !important; }
    .rv-stack { height: 16px; }
    .rv-seg { transition: none; font-size: 0.62rem; }
    .rv-legend { font-size: 0.72rem; margin-bottom: 0.4rem; }
    .rv-breakdown { font-size: 0.7rem; margin-top: 0.2rem; padding-left: 2.35rem !important; }
    .rv-val { font-size: 0.8rem; min-width: 6.5rem; }
    footer { margin-top: 1rem !important; padding-top: 0.5rem !important; }
  }

  /* Searchable dropdown (same look as the form) */
  .form-label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #334155; font-size: 0.95rem; }
  .form-input {
    width: 100%; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;
    color: #1e293b; background-color: #f8fafc; outline: none; box-sizing: border-box; font-family: inherit;
    transition: all 0.2s ease;
  }
  .form-input:focus { border-color: #0a72b5; background-color: #fff; box-shadow: 0 0 0 3px rgba(10,114,181,0.15); }
  .ss-root { position: relative; }
  .ss-control { position: relative; }
  .ss-input { padding-right: 4.25rem !important; cursor: pointer; }
  .ss-input:focus { cursor: text; }
  .ss-disabled .ss-input { cursor: not-allowed; opacity: 0.6; }
  .ss-caret { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); font-size: 0.65rem; color: #64748b; pointer-events: none; }
  .ss-clear {
    position: absolute; right: 2.25rem; top: 50%; transform: translateY(-50%);
    width: 24px; height: 24px; border: none; border-radius: 50%; background: transparent;
    color: #94a3b8; font-size: 1.1rem; line-height: 1; cursor: pointer;
  }
  .ss-clear:hover { background: #e2e8f0; color: #475569; }
  .ss-list {
    position: absolute; z-index: 30; left: 0; right: 0; top: calc(100% + 4px); max-height: 260px; overflow-y: auto;
    margin: 0; padding: 0.25rem; list-style: none; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
  }
  .ss-option { padding: 0.6rem 0.75rem; border-radius: 6px; cursor: pointer; color: #1e293b; }
  .ss-active { background-color: rgba(10, 114, 181, 0.08); }
  .ss-selected { font-weight: 600; color: #0a72b5; }
  .ss-empty { padding: 0.6rem 0.75rem; color: #94a3b8; font-style: italic; font-size: 0.9rem; }
  .ss-mark { background: #fde68a; color: inherit; padding: 0; border-radius: 2px; }
`;
