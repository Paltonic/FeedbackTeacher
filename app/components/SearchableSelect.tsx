"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
};

const MAX_SHOWN = 100;

/** Dropdown you can type into to search. Only values from `options` can be chosen. */
export default function SearchableSelect({
  options,
  value,
  onChange,
  onBlur,
  placeholder = "Type to search…",
  disabled = false,
  disabledPlaceholder,
  emptyText = "No results",
  invalid = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const shown = matches.slice(0, MAX_SHOWN);

  // keep the highlighted option visible while using arrow keys
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setActive(Math.max(0, options.indexOf(value)));
  };

  const close = () => {
    setOpen(false);
    setQuery("");
    onBlur?.();
  };

  const select = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) return openList();
        setActive((a) => Math.min(a + 1, shown.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        break;
      case "Enter":
        e.preventDefault(); // never submit the form from here
        if (open && shown[active]) select(shown[active]);
        else if (!open) openList();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
          setQuery("");
        }
        break;
    }
  };

  const shownPlaceholder = disabled && disabledPlaceholder ? disabledPlaceholder : open && value ? value : placeholder;

  return (
    <div className="ss-root">
      <div className={`ss-control${invalid ? " ss-invalid" : ""}${disabled ? " ss-disabled" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          className="form-input ss-input"
          placeholder={shownPlaceholder}
          disabled={disabled}
          value={open ? query : value}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onBlur={close}
          onKeyDown={onKeyDown}
        />
        {value && !disabled && (
          <button
            type="button"
            className="ss-clear"
            aria-label="Clear selection"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
        <span className="ss-caret" aria-hidden>
          ▼
        </span>
      </div>

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          ref={listRef}
          className="ss-list"
          // keep focus in the input when clicking/scrolling the list
          onMouseDown={(e) => e.preventDefault()}
        >
          {shown.length === 0 ? (
            <li className="ss-empty">{emptyText}</li>
          ) : (
            shown.map((opt, i) => (
              <li
                key={`${opt}-${i}`}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={opt === value}
                className={`ss-option${i === active ? " ss-active" : ""}${opt === value ? " ss-selected" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => select(opt)}
              >
                {highlight(opt, query)}
              </li>
            ))
          )}
          {matches.length > MAX_SHOWN && (
            <li className="ss-empty">
              Showing {MAX_SHOWN} of {matches.length} — type more to narrow down
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="ss-mark">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
