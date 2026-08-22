export default function TableControls({ entries, onEntriesChange, search, onSearchChange }) {
  return (
    <div className="table-controls">
      <div className="show-entries">
        <span>Show</span>
        <select value={entries} onChange={(e) => onEntriesChange(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>entries</span>
      </div>
      <div className="search-box">
        <label>Search:</label>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder=""
        />
      </div>
    </div>
  );
}
