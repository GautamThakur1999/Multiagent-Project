"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";

export interface EditableChipsProps {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Custom chip renderer (e.g. category Tag). Falls back to a teal value chip. */
  renderChip?: (value: string, onRemove: () => void) => ReactNode;
}

/** A label + an editable list of string chips, with add (Enter/blur) and remove. */
export function EditableChips({
  label,
  values,
  onChange,
  placeholder = "Add…",
  renderChip,
}: EditableChipsProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed && !values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  };

  const remove = (index: number) => onChange(values.filter((_, i) => i !== index));

  return (
    <div>
      <span className="mb-3 block text-label-sm uppercase text-outline">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((value, i) =>
          renderChip ? (
            <span key={`${value}-${i}`}>{renderChip(value, () => remove(i))}</span>
          ) : (
            <span
              key={`${value}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-label-md text-primary"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => remove(i)}
                className="-mr-1 rounded-full p-0.5 hover:bg-on-surface/10"
              >
                <Icon name="close" className="text-[16px]" />
              </button>
            </span>
          )
        )}
        <input
          aria-label={`Add ${label}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className="min-w-[7rem] flex-grow border-none bg-transparent px-2 py-1 text-label-md text-on-surface placeholder:text-outline focus:outline-none"
        />
      </div>
    </div>
  );
}
