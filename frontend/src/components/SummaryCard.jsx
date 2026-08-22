// Title + row of 2-3 icon metrics (Admission Done / Today's Record / Leads Overview)
export default function SummaryCard({ title, metrics }) {
  return (
    <div className="summary-card">
      <div className="summary-card-title">{title}</div>
      <div className="summary-metrics">
        {metrics.map((m) => (
          <div key={m.label} className="summary-metric">
            <span className="summary-metric-icon">{m.icon}</span>
            <div>
              <div className="summary-metric-number">{m.number}</div>
              <div className="summary-metric-label">{m.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
