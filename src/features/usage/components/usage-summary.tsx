import type { ApolloUsageSummary } from "@/features/usage/lib/apollo-usage";

type UsageSummaryProps = {
  summary: ApolloUsageSummary;
};

export function UsageSummary({ summary }: UsageSummaryProps) {
  return (
    <section className="card stack">
      <div className="workspace-actions">
        <span className="badge">{summary.heading}</span>
      </div>
      <p className="field-hint">{summary.detail}</p>
      {summary.stats.length > 0 ? (
        <div className="stats-grid">
          {summary.stats.map((stat) => (
            <div key={stat.label} className="stat-tile">
              <span className="meta">{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
