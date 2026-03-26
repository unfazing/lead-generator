"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { InfoTip } from "@/features/ui/components/info-tip";

type MultiValueInputProps = {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  values: string[];
  actions?: ReactNode;
  onValuesChange?: (values: string[]) => void;
};

function normalizeToken(value: string) {
  return value.trim();
}

export function MultiValueInput({
  name,
  label,
  hint,
  placeholder,
  values,
  actions,
  onValuesChange,
}: MultiValueInputProps) {
  const [items, setItems] = useState(values);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setItems(values);
    setDraft("");
  }, [values]);

  useEffect(() => {
    onValuesChange?.(items);
  }, [items, onValuesChange]);

  function addToken(rawValue: string) {
    const nextValues = rawValue
      .split(",")
      .map(normalizeToken)
      .filter(Boolean)
      .filter((value) => !items.includes(value));

    if (nextValues.length === 0) {
      return;
    }

    setItems((current) => [...current, ...nextValues]);
    setDraft("");
  }

  function removeToken(value: string) {
    setItems((current) => current.filter((item) => item !== value));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addToken(draft);
    }

    if (event.key === "Backspace" && !draft && items.length > 0) {
      event.preventDefault();
      removeToken(items[items.length - 1]);
    }
  }

  return (
    <div className="field full">
      <label className="label-with-tip">
        <span>{label}</span>
        <InfoTip
          content={hint ?? "Add one value at a time. Press Enter or comma to create a value."}
          label={`${label} help`}
        />
        {actions}
      </label>
      <div className="token-input">
        {items.map((value) => (
          <span key={value} className="token-chip">
            <span>{value}</span>
            <button type="button" onClick={() => removeToken(value)} aria-label={`Remove ${value}`}>
              ×
            </button>
            <input type="hidden" name={name} value={value} />
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addToken(draft)}
          placeholder={placeholder}
          className="token-input-field"
        />
      </div>
    </div>
  );
}
