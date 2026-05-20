export default function TotalCalls({ callStats }) {
  if (!callStats) return null;

  const stats = [
    { num: callStats.outgoing, label: 'Outgoing' },
    { num: callStats.missed, label: 'Missed' },
    { num: callStats.incoming, label: 'Incoming' },
    { num: callStats.rejected, label: 'Rejected' }
  ];

  return (
    <div className="card">
      <div className="card-title">Total Calls</div>
      <div className="total-calls-grid">
        {stats.map((s) => (
          <div key={s.label} className="call-stat">
            <div className="call-stat-num">{s.num}</div>
            <div className="call-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="total-row">
        <div className="call-stat-num">{callStats.total}</div>
        <div className="call-stat-label">Total</div>
      </div>
    </div>
  );
}
