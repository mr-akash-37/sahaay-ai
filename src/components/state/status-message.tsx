import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centered message used for empty, error and not-found states. */
export function StatusMessage({
  icon,
  title,
  body,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:py-24", className)}
    >
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary [&_svg]:size-8">
        {icon}
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </section>
  );
}
