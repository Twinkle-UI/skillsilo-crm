export default function FollowUpsHeader({ onDownload }) {
  return (
    <div className="leads-header">
      <h1 className="leads-title">Follow-Ups</h1>
      <div className="leads-actions">
        <button className="leads-btn" onClick={onDownload}>
          <span className="btn-icon">⬇</span> Download
        </button>
      </div>
    </div>
  );
}