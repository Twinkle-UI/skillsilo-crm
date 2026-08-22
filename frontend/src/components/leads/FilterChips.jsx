export default function FilterChips({ filters, active, onFilterChange }) {
  if (!filters || filters.length === 0) {
    return <div className="filter-chips"><span style={{ color: '#999' }}>Loading filters...</span></div>;
  }

  return (
    <div className="filter-chips">
      {filters.map((filter) => (
        <button
          key={filter.name}
          className={`chip ${active === filter.name ? 'chip-active' : ''}`}
          onClick={() => onFilterChange(filter.name)}
        >
          {filter.name} ({filter.count})
        </button>
      ))}
    </div>
  );
}
