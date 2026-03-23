function toLabel(key: string) {
  return key
    .replace(/\[\]$/u, "")
    .split(/(?=[A-Z])|_/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.slice(0, 2).join(", ") : "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  return "";
}

export function summarizeSnapshotParams(
  params: Record<string, unknown>,
  limit = 3,
) {
  return Object.entries(params)
    .map(([key, value]) => {
      const formattedValue = formatValue(value);

      if (!formattedValue) {
        return null;
      }

      return `${toLabel(key)}: ${formattedValue}`;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, limit);
}
