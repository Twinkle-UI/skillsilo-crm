export default function FollowUpFilters({ filters, active, onFilterChange }) {
  if (!filters || filters.length === 0) {
    return (
      <div className="filter-chips">
        <span style={{ color: '#999' }}>Loading filters...</span>
      </div>
    );
  }

  return (
    <div className="filter-chips">
      {filters.map((filter) => (
        <button
          key={filter.key}
          className={`chip ${active === filter.key ? 'chip-active' : ''}`}
          onClick={() => onFilterChange(filter.key)}
        >
          {filter.name} ({filter.count})
        </button>
      ))}
    </div>
  );
}
