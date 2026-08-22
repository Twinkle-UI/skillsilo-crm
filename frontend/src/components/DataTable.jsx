// Reusable table - horizontal scroll wrapper se mobile pe achha dikhega
export default function DataTable({ title, columns, rows, scrollable = false }) {
  const tableContent = (
    <table>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} style={{ textAlign: col.align || 'left' }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col, j) => (
              <td key={j} className={col.align === 'right' ? 'num' : ''}>
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {scrollable ? (
        <div className="scroll-table">{tableContent}</div>
      ) : (
        <div className="table-wrapper">{tableContent}</div>
      )}
    </div>
  );
}
