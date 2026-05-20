import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Color map for call types
const COLORS = {
  Outgoing: '#3eb8b1',
  Missed: '#dc3545',
  Incoming: '#4a9eff',
  Rejected: '#888'
};

export default function CallLogsChart({ chartData }) {
  if (!chartData) return null;

  // Apply colors to datasets from API
  const data = {
    ...chartData,
    datasets: chartData.datasets.map((ds) => ({
      ...ds,
      backgroundColor: COLORS[ds.label] || '#888'
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true }
    },
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10 } }
    }
  };

  return (
    <div className="card">
      <div className="card-title">Call Logs</div>
      <div className="chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
