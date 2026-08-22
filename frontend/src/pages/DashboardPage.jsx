import { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import StatCard from '../components/StatCard';
import IconStatCard from '../components/IconStatCard';
import SummaryCard from '../components/SummaryCard';
import TotalCalls from '../components/TotalCalls';
import CallLogsChart from '../components/CallLogsChart';
import MonthChart from '../components/MonthChart';
import StageChart from '../components/StageChart';
import DataTable from '../components/DataTable';
import { dashboardAPI } from '../services/api';
import { usePermissions } from '../contexts/PermissionsContext';

export default function DashboardPage() {
  const { isAdmin } = usePermissions();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await dashboardAPI.getStats();
        if (!cancelled) {
          setData(res.data);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    // Cleanup - prevent state update on unmounted component
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <div className="loading-state">⏳ Loading dashboard...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardHeader />
        <div className="error-state">
          ❌ Error: {error}
          <br />
          <small>Make sure backend is running on port 5000</small>
        </div>
      </>
    );
  }

  // ============ ADMIN: purana simple dashboard ============
  if (isAdmin) {
    return (
      <>
        <DashboardHeader />

        <div className="container">
          {/* LEFT */}
          <div className="col">
            <div className="stat-grid">
              {data.topStats.map((s) => (
                <StatCard key={s.label} number={s.number} label={s.label} />
              ))}
            </div>

            <TotalCalls callStats={data.callStats} />
            <CallLogsChart chartData={data.callLogsChartData} />

            <DataTable
              title="Source v/s Leads"
              columns={[
                { key: 'source', label: 'Source' },
                { key: 'leads', label: 'Leads', align: 'right' }
              ]}
              rows={data.sourceData}
            />

            <DataTable
              title="Location v/s Leads"
              columns={[
                { key: 'state', label: 'States' },
                { key: 'leads', label: 'Leads', align: 'right' }
              ]}
              rows={data.locationData}
              scrollable
            />
          </div>

          {/* MIDDLE */}
          <div className="col">
            <MonthChart chartData={data.monthChartData} />
            <StageChart stageData={data.stageData} />

            <DataTable
              title="Categories v/s Leads"
              columns={[
                { key: 'category', label: 'Category' },
                { key: 'leads', label: 'Leads', align: 'right' }
              ]}
              rows={data.categoryData}
            />
          </div>

          {/* RIGHT */}
          <div className="col">
            <DataTable
              title="University v/s Leads"
              columns={[
                { key: 'university', label: 'University' },
                { key: 'leads', label: 'Leads', align: 'right' }
              ]}
              rows={data.universityData}
            />

            <DataTable
              title="Users v/s Leads"
              columns={[
                { key: 'user', label: 'Users' },
                { key: 'university', label: 'University' },
                { key: 'leads', label: 'Leads', align: 'right' }
              ]}
              rows={data.usersData}
              scrollable
            />
          </div>
        </div>
      </>
    );
  }

  // ============ USER (non-admin): naya rich dashboard ============
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  return (
    <>
      <DashboardHeader />

      {/* Row 1 - Last Updated / Total Leads / Emails / SMS */}
      <div className="icon-stat-row">
        <IconStatCard icon="🕐" number={lastUpdatedLabel} label="Last Updated on" />
        {data.topStats.map((s) => (
          <IconStatCard key={s.label} icon={s.icon} number={s.number} label={s.label} />
        ))}
      </div>

      {/* Row 2 - Follow-up breakdown */}
      <div className="icon-stat-row icon-stat-row-4">
        {data.followUpStats.map((s) => (
          <IconStatCard key={s.label} icon={s.icon} number={s.number} label={s.label} />
        ))}
      </div>

      {/* Row 3 - Admission Done / Today's Record / Leads Overview */}
      <div className="summary-row">
        <SummaryCard title={data.admissionDone.title} metrics={data.admissionDone.metrics} />
        <SummaryCard title={data.todaysRecord.title} metrics={data.todaysRecord.metrics} />
        <SummaryCard title={data.leadsOverview.title} metrics={data.leadsOverview.metrics} />
      </div>

      <div className="container">
        {/* LEFT */}
        <div className="col">
          <TotalCalls callStats={data.callStats} />
          <CallLogsChart chartData={data.callLogsChartData} />

          <DataTable
            title="Source v/s Leads"
            columns={[
              { key: 'source', label: 'Source' },
              { key: 'leads', label: 'Leads', align: 'right' }
            ]}
            rows={data.sourceData}
          />

          <DataTable
            title="Location v/s Leads"
            columns={[
              { key: 'state', label: 'States' },
              { key: 'leads', label: 'Leads', align: 'right' }
            ]}
            rows={data.locationData}
            scrollable
          />
        </div>

        {/* MIDDLE */}
        <div className="col">
          <MonthChart chartData={data.monthChartData} />
          <StageChart stageData={data.stageData} />

          <DataTable
            title="Categories v/s Leads"
            columns={[
              { key: 'category', label: 'Category' },
              { key: 'leads', label: 'Leads', align: 'right' }
            ]}
            rows={data.categoryData}
          />
        </div>

        {/* RIGHT */}
        <div className="col">
          <DataTable
            title="University v/s Leads"
            columns={[
              { key: 'university', label: 'University' },
              { key: 'leads', label: 'Leads', align: 'right' }
            ]}
            rows={data.universityData}
          />

          <DataTable
            title="Users v/s Leads"
            columns={[
              { key: 'user', label: 'Users' },
              { key: 'university', label: 'University' },
              { key: 'leads', label: 'Leads', align: 'right' }
            ]}
            rows={data.usersData}
            scrollable
          />
        </div>
      </div>
    </>
  );
}
