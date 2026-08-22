import { Bar } from 'react-chartjs-2';

export default function StageChart({ stageData }) {
  if (!stageData || stageData.length === 0) return null;

  const data = {
    labels: stageData.map((s) => s.stage),
    datasets: [
      {
        label: 'Leads',
        data: stageData.map((s) => s.leads),
        backgroundColor: '#4a9eff',
        barThickness: 10
      }
    ]
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { beginAtZero: true },
      y: { grid: { display: false }, ticks: { font: { size: 9 } } }
    },
    plugins: { legend: { display: false } }
  };

  return (
    <div className="card">
      <div className="card-title">Stage v/s Leads</div>
      <div className="chart-container tall">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
