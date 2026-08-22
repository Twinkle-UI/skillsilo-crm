// Wide horizontal card - number/label left, icon right (top rows of Dashboard)
export default function IconStatCard({ icon, number, label }) {
  return (
    <div className="icon-stat-card">
      <div>
        <div className="icon-stat-number">{number}</div>
        <div className="icon-stat-label">{label}</div>
      </div>
      <div className="icon-stat-icon">{icon}</div>
    </div>
  );
}
