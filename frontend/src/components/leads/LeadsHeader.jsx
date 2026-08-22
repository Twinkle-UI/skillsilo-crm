export default function LeadsHeader({
  onAdd,
  onUpload,
  onDownload,
  onFilters,
  activeFilterCount = 0
}) {
  return (
    <div className="leads-header">
      <h1 className="leads-title">Leads</h1>
      <div className="leads-actions">
        <button className="leads-btn" onClick={onAdd}>
          <span className="btn-icon">+</span> Add
        </button>
        <button className="leads-btn" onClick={onUpload}>
          <span className="btn-icon">⬆</span> Upload
        </button>
        <button className="leads-btn" onClick={onDownload}>
          <span className="btn-icon">⬇</span> Download
        </button>
        <button className="leads-btn" onClick={onFilters}>
          <span className="btn-icon">▽</span> Filters
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}