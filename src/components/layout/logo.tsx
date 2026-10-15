import { cn } from "@/lib/utils";
import { HANDSHAKE_PATHS } from "./logo-paths";

/** Brand mark: a white handshake inside a rounded blue square. Decorative — pair with visible text. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <g
        transform="translate(5 5) scale(0.9167)"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {HANDSHAKE_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
