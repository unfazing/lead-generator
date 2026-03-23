import Link from "next/link";

type WorkspaceEmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
};

export function WorkspaceEmptyState({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
}: WorkspaceEmptyStateProps) {
  return (
    <section className="card stack">
      <div className="workspace-header">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {primaryAction || secondaryAction ? (
        <div className="workspace-actions">
          {primaryAction ? (
            <Link className="primary-button" href={primaryAction.href}>
              {primaryAction.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link className="secondary-button" href={secondaryAction.href}>
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
