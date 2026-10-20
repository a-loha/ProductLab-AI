import { useId } from "react";
import type { ReactNode } from "react";
import { channelRows, platformRows } from "./content";
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export const percent = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
export type IconName =
  | "grid"
  | "play"
  | "book"
  | "chart"
  | "arrow"
  | "check"
  | "leaf"
  | "reset"
  | "cash";
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    play: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <path d="m10 8 6 4-6 4Z" />
      </>
    ),
    book: (
      <path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" />
    ),
    chart: <path d="M4 4v16h16M8 15v-4m5 4V7m5 8v-6" />,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    leaf: (
      <>
        <path d="M20 4C11 3 4 7 4 13a7 7 0 0 0 7 7c6 0 10-7 9-16Z" />
        <path d="m4 20 10-10" />
      </>
    ),
    reset: <path d="M4 9a8 8 0 1 1 0 7M4 3v6h6" />,
    cash: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 12h.01m12 0h.01" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function Button({
  children,
  onClick,
  secondary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      className={`button ${secondary ? "secondary" : "primary"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function Pill({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
type Choice = {
  id: string;
  title: string;
  description?: string;
  tradeoff?: string;
};
export function ChoiceGroup({
  legend,
  options,
  value,
  onChange,
  disabled = false,
}: {
  legend: string;
  options: Choice[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="choice-group" disabled={disabled}>
      <legend>{legend}</legend>
      {options.map((option, index) => (
        <label
          className={`choice ${value === option.id ? "selected" : ""}`}
          key={option.id}
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <span className="choice-copy">
            <strong>
              <span className="choice-letter">
                {String.fromCharCode(65 + index)}
              </span>
              {option.title}
            </strong>
            {option.description && <span>{option.description}</span>}
            {option.tradeoff && <small>{option.tradeoff}</small>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
export function CohortTable({ platform = false }: { platform?: boolean }) {
  const rows = platform ? platformRows : channelRows;
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label={
        platform
          ? "Paid-social platform cohort comparison"
          : "Acquisition channel cohort comparison"
      }
      tabIndex={0}
    >
      <table>
        <caption>
          {platform ? "Paid-social cohort detail" : "Verified cohort snapshot"}{" "}
          · new paying subscribers, activity on day 30
        </caption>
        <thead>
          <tr>
            <th scope="col">{platform ? "Platform" : "Channel"}</th>
            <th scope="col">
              Previous cohort
              <br />
              <span>Size · Active · D30</span>
            </th>
            <th scope="col">
              Latest cohort
              <br />
              <span>Size · Active · D30</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.channel}>
              <th scope="row">{row.channel}</th>
              <td>
                {row.beforeN} · {row.beforeActive} ·{" "}
                <strong>{(row.beforeActive / row.beforeN) * 100}%</strong>
              </td>
              <td>
                {row.afterN} · {row.afterActive} ·{" "}
                <strong>{(row.afterActive / row.afterN) * 100}%</strong>
              </td>
            </tr>
          ))}
          {!platform && (
            <tr className="total-row">
              <th scope="row">All channels</th>
              <td>
                1,000 · 280 · <strong>28%</strong>
              </td>
              <td>
                1,000 · 210 · <strong>21%</strong>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="fine-print">
        Both periods are fully matured, with the same event definition. Activity
        retention is not subscription renewal.
      </p>
    </div>
  );
}
