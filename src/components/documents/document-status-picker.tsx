"use client";

import type { DocumentId } from "@/data/documents";
import type { Dictionary } from "@/i18n/dictionaries";
import type { DocumentStatus, DocumentStatuses } from "@/lib/engine/roadmap";
import { documentStore } from "@/lib/profile/local-store";
import { cn } from "@/lib/utils";

const order: DocumentStatus[] = ["missing", "applying", "have"];

/** "Not yet / Applied / I have it" — saved on this device. */
export function DocumentStatusPicker({
  documentId,
  statuses,
  dict,
}: {
  documentId: DocumentId;
  statuses: DocumentStatuses;
  dict: Dictionary;
}) {
  const current = statuses[documentId] ?? "missing";

  function update(status: DocumentStatus) {
    documentStore.set({ ...(documentStore.get() ?? {}), [documentId]: status });
  }

  return (
    <fieldset>
      <legend className="sr-only">{dict.documents.statusLabel}</legend>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {order.map((status) => (
          <label
            key={status}
            className={cn(
              "flex min-h-10 cursor-pointer items-center justify-center rounded-lg px-2 text-center text-sm font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring",
              current === status
                ? status === "have"
                  ? "bg-success-soft text-success-strong shadow-sm"
                  : "bg-card text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={`doc-${documentId}`}
              value={status}
              checked={current === status}
              onChange={() => update(status)}
            />
            {dict.documents[status]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
