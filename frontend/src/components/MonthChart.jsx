import { Bar } from 'react-chartjs-2';

export default function MonthChart({ chartData }) {
  if (!chartData) return null;

  // Format API data into Chart.js structure
  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Leads',
        data: chartData.data,
        backgroundColor: '#4a9eff',
        barThickness: 35
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true }
    },
    plugins: { legend: { display: false } }
  };

  return (
    <div className="card">
      <div className="card-title">Month v/s Leads</div>
      <div className="chart-container tall">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
