import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { definitions } from "./mission-content";
import type { Term } from "./mission-content";

export function MetricLabel({
  term,
  children,
}: {
  term: Term;
  children?: ReactNode;
}) {
  return (
    <span className="metric-term">
      {children ?? definitions[term].label}
      <MetricHelp term={term} />
    </span>
  );
}
export function MetricHelp({ term }: { term: Term }) {
  const definition = definitions[term],
    id = useId(),
    button = useRef<HTMLButtonElement>(null),
    tip = useRef<HTMLDivElement>(null),
    leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false),
    [pinned, setPinned] = useState(false),
    [position, setPosition] = useState({ left: 16, top: 16 });
  const cancelLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };
  const leave = () => {
    cancelLeave();
    if (!pinned && document.activeElement !== button.current)
      leaveTimer.current = setTimeout(() => setOpen(false), 150);
  };
  useEffect(() => () => cancelLeave(), []);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!button.current || !tip.current) return;
      const anchor = button.current.getBoundingClientRect(),
        height = tip.current.getBoundingClientRect().height;
      setPosition({
        left: Math.max(12, Math.min(anchor.left, window.innerWidth - 312)),
        top:
          anchor.bottom + height + 14 < window.innerHeight
            ? anchor.bottom + 9
            : Math.max(12, anchor.top - height - 9),
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    return () => window.removeEventListener("scroll", place, true);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const dismiss = () => {
      setOpen(false);
      setPinned(false);
    };
    const outside = (event: PointerEvent) => {
      if (
        !button.current?.contains(event.target as Node) &&
        !tip.current?.contains(event.target as Node)
      )
        dismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        dismiss();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);
  return (
    <>
      <button
        ref={button}
        type="button"
        className="metric-help"
        aria-label={`About ${definition.label}`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setPinned(false);
        }}
        onMouseEnter={() => {
          cancelLeave();
          setOpen(true);
        }}
        onMouseLeave={leave}
        onClick={() => {
          setOpen(!pinned);
          setPinned(!pinned);
        }}
      >
        i
      </button>
      {open &&
        createPortal(
          <div
            ref={tip}
            id={id}
            role="tooltip"
            className="metric-tooltip"
            style={position}
            onMouseEnter={cancelLeave}
            onMouseLeave={leave}
          >
            <strong>{definition.label}</strong>
            <p>{definition.definition}</p>
            <code>{definition.formula}</code>
            <p className="tooltip-caveat">{definition.caveat}</p>
            <small>Escape or click outside to close.</small>
          </div>,
          document.body,
        )}
    </>
  );
}
export function CheatSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [query, setQuery] = useState("");
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);
  const entries = Object.entries(definitions).filter(([, definition]) =>
    `${definition.label} ${definition.definition} ${definition.formula}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const groups = [
    ...new Set(
      Object.values(definitions).map((definition) => definition.group),
    ),
  ];
  return (
    <dialog
      ref={dialog}
      className="cheat-sheet"
      aria-labelledby="cheat-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="cheat-header">
        <div>
          <span className="eyebrow">ALWAYS WITHIN REACH</span>
          <h2 id="cheat-title">Cheat Sheet</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close Cheat Sheet"
        >
          ×
        </button>
      </div>
      <p className="muted">
        Formulas, assumptions, and practical ways to think. Your workspace stays
        where you left it.
      </p>
      <label className="sr-only" htmlFor="cheat-search">
        Search Cheat Sheet
      </label>
      <input
        id="cheat-search"
        className="search-input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Find CAC, discovery, guardrails…"
      />
      {groups.map((group) => {
        const items = entries.filter(
          ([, definition]) => definition.group === group,
        );
        return (
          items.length > 0 && (
            <details
              key={group}
              className="cheat-group"
              open={!!query || group === groups[0]}
            >
              <summary>
                {group}
                <span>{items.length}</span>
              </summary>
              <dl>
                {items.map(([key, definition]) => (
                  <div key={key}>
                    <dt>{definition.label}</dt>
                    <dd>
                      <p>{definition.definition}</p>
                      <code>{definition.formula}</code>
                      <p>{definition.caveat}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          )
        );
      })}
      {entries.length === 0 && (
        <p className="empty-help">
          No matching term. Try a metric name or framework.
        </p>
      )}
      <p className="fine-print">
        Pulse is fictional. Simplified economic models are learning tools, not
        forecasts.
      </p>
    </dialog>
  );
}
