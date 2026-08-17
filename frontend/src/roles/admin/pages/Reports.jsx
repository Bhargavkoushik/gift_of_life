import { useState, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import * as adminService from '../../../services/adminService';

const PERIOD_OPTIONS = [
  { value: 'all_time', label: 'All Time' },
  { value: 'last_7_days', label: 'Last 7 Days (Daily)' },
  { value: 'this_month', label: 'This Month (Daily)' },
  { value: 'last_3_months', label: 'Last 3 Months (Weekly)' },
  { value: 'this_year', label: 'This Year (Monthly)' }
];

const UI_LABELS = {
  'PENDING': 'Pending Approval',
  'APPROVED': 'Active Matching',
  'DONORS_ALERTED': 'Active Matching',
  'DONOR_RESPONDED': 'Donor Responded',
  'COORDINATOR_ASSIGNED': 'In Coordination',
  'DONOR_CONFIRMED': 'In Coordination',
  'FULFILLED': 'Fulfilled',
  'CANCELLED': 'Cancelled',
  'REJECTED': 'Rejected',
  'NO_DONOR_FOUND': 'No Donor Found'
};

const ORDERED_LABELS = [
  'Pending Approval',
  'Active Matching',
  'Donor Responded',
  'In Coordination',
  'Fulfilled',
  'Cancelled',
  'Rejected',
  'No Donor Found'
];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all_time');
  const [reportData, setReportData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadReportsData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminService.getAdminReports({ period });
      setReportData(res.reports);
    } catch (err) {
      console.error('Error loading reports:', err);
      setErrorMsg(`Failed to load operational analytics. ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [period]);

  if (loading && !reportData) {
    return (
      <div className="page-stack max-w-6xl relative select-none">
        <PageHeader title="Reports" description="Operational overview of ASN Raju Blood Centre" />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
        </div>
      </div>
    );
  }

  const {
    operationsSummary = { totalRequests: 0, fulfilledRequests: 0, fulfillmentRate: 0, totalDonations: 0, totalUnitsDonated: 0 },
    requestOutcomes = [],
    bloodGroupStats = [],
    donorContribution = { registeredDonors: 0, activeDonors: 0, donatedDonors: 0, repeatDonors: 0 },
    coordinatorWorkload = [],
    activityTrend = []
  } = reportData || {};

  const hasData = operationsSummary.totalRequests > 0 || operationsSummary.totalDonations > 0;

  const statusCounts = {};
  requestOutcomes.forEach(item => {
    statusCounts[item.status] = parseInt(item.count, 10);
  });

  const getCount = (statuses) => {
    return statuses.reduce((sum, st) => sum + (statusCounts[st] || 0), 0);
  };

  // Funnel numbers
  const funnel = {
    received: operationsSummary.totalRequests,
    responded: getCount(['DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED']),
    inCoordination: getCount(['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED']),
    fulfilled: operationsSummary.fulfilledRequests
  };

  const unsuccessful = {
    cancelled: getCount(['CANCELLED']),
    rejected: getCount(['REJECTED']),
    noDonor: getCount(['NO_DONOR_FOUND'])
  };

  const processedBloodGroups = bloodGroupStats.map(item => {
    return {
      ...item
    };
  });

  // SVG Chart Dimensions & Configuration
  const svgWidth = 500;
  const svgHeight = 160;
  const chartPadding = 25;
  const maxTrendVal = Math.max(...activityTrend.map(pt => Math.max(pt.requests, pt.donations)), 1);

  // Helper to format timestamps to human-readable date strings on X-axis and tooltips
  const formatTrendLabel = (labelStr, selectedPeriod) => {
    if (!labelStr) return '';
    const d = new Date(labelStr);
    if (isNaN(d.getTime())) return labelStr;

    if (selectedPeriod === 'last_7_days' || selectedPeriod === 'this_month') {
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const day = d.getDate();
      return `${weekday} ${day}`;
    } else if (selectedPeriod === 'last_3_months') {
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return `Wk of ${day} ${month}`;
    } else if (selectedPeriod === 'this_year') {
      return d.toLocaleDateString('en-US', { month: 'short' });
    } else {
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear().toString().slice(-2);
      return `${month} '${year}`;
    }
  };

  // Generate SVG coordinates for trend polylines
  const pointsReq = activityTrend.map((pt, i) => {
    const x = (i / (activityTrend.length - 1 || 1)) * (svgWidth - chartPadding * 2) + chartPadding;
    const y = svgHeight - chartPadding - (pt.requests / maxTrendVal) * (svgHeight - chartPadding * 2);
    return { x, y, val: pt.requests, label: pt.label };
  });

  const pointsDon = activityTrend.map((pt, i) => {
    const x = (i / (activityTrend.length - 1 || 1)) * (svgWidth - chartPadding * 2) + chartPadding;
    const y = svgHeight - chartPadding - (pt.donations / maxTrendVal) * (svgHeight - chartPadding * 2);
    return { x, y, val: pt.donations, label: pt.label };
  });

  const trendHasData = activityTrend.some(pt => pt.requests > 0 || pt.donations > 0);
  const totalTrendReqs = activityTrend.reduce((sum, pt) => sum + pt.requests, 0);
  const totalTrendDons = activityTrend.reduce((sum, pt) => sum + pt.donations, 0);

  return (
    <div className="page-stack max-w-6xl relative select-none space-y-6">
      
      {/* HEADER AND TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Reports"
          description="Operational overview of ASN Raju Blood Centre"
        />
        <div className="flex items-center gap-2">
          <label className="text-xxs font-bold text-slate-450 uppercase whitespace-nowrap">Time Window:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-brand-red cursor-pointer shadow-sm"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 max-w-5xl">
        💡 <strong>Analytical Mappings:</strong> Requests metrics filter on request creation date (`created_at`). Completed donations filter on donation date (`donation_date`). Coordinator workload stats filter on assignment date (`assigned_at`).
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 p-4 text-xs font-semibold text-rose-800 border border-rose-100 max-w-3xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {!hasData ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 max-w-5xl shadow-sm">
          <svg className="mx-auto h-12 w-12 text-slate-350" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7Z" />
          </svg>
          <h3 className="mt-4 text-xs font-bold text-slate-700 uppercase tracking-wider">No operational data recorded in this period.</h3>
          <p className="mt-1 text-xxs text-slate-450 font-semibold">Try choosing a wider date filter range.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl">

          {/* A. OPERATIONS AT A GLANCE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
            <div className="flex flex-wrap justify-between items-center gap-6">
              <div className="flex-1 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Total Requests</span>
                <strong className="text-xl font-extrabold text-slate-800">{operationsSummary.totalRequests}</strong>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden sm:block" />

              <div className="flex-1 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Fulfilled Requests</span>
                <strong className="text-xl font-extrabold text-slate-800">{operationsSummary.fulfilledRequests}</strong>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden sm:block" />

              <div className="flex-1 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Completed Donations</span>
                <strong className="text-xl font-extrabold text-purple-600">{operationsSummary.totalDonations}</strong>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden sm:block" />

              <div className="flex-1 min-w-[120px]">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Total Units</span>
                <strong className="text-xl font-extrabold text-brand-red">{operationsSummary.totalUnitsDonated}</strong>
              </div>
            </div>
            
            {/* Primary Interpretation */}
            <div className={`text-xxs font-bold px-4 py-2.5 rounded-xl border ${
              operationsSummary.fulfillmentRate >= 50
                ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                : 'bg-amber-50 border-amber-150 text-amber-700'
            }`}>
              📊 <strong>Fulfillment Rate Interpretation:</strong> {operationsSummary.fulfillmentRate}% of requests were successfully fulfilled ({operationsSummary.fulfilledRequests} of {operationsSummary.totalRequests} total requests).
            </div>
          </div>

          {/* B. REQUEST & DONATION ACTIVITY TREND */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-455">
                  Request & Donation Activity Trend
                </h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                  📈 {totalTrendReqs} request{totalTrendReqs === 1 ? '' : 's'} created · {totalTrendDons} donation{totalTrendDons === 1 ? '' : 's'} completed during this period
                </p>
              </div>
              <div className="flex gap-4 items-center text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-slate-400 inline-block" />
                  Requests Created
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-brand-red inline-block" />
                  Completed Donations
                </span>
              </div>
            </div>

            {!trendHasData ? (
              <div className="text-center py-8 text-xxs font-bold text-slate-400">
                No request or completed donation activity recorded during this period.
              </div>
            ) : (
              <div className="space-y-2">
                {/* SVG Time-Series Chart */}
                <div className="overflow-x-auto">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-h-[180px] font-mono select-none">
                    {/* Y-axis helper lines */}
                    {[0, 0.5, 1].map((ratio, idx) => {
                      const y = svgHeight - chartPadding - ratio * (svgHeight - chartPadding * 2);
                      const labelVal = Math.round(ratio * maxTrendVal);
                      return (
                        <g key={idx}>
                          <line x1={chartPadding} y1={y} x2={svgWidth - chartPadding} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                          <text x={chartPadding - 5} y={y + 3} textAnchor="end" className="text-[8px] fill-slate-400 font-bold">{labelVal}</text>
                        </g>
                      );
                    })}

                    {/* Date points labels */}
                    {activityTrend.map((pt, i) => {
                      if (activityTrend.length > 10 && i % Math.ceil(activityTrend.length / 6) !== 0) return null;
                      const x = (i / (activityTrend.length - 1 || 1)) * (svgWidth - chartPadding * 2) + chartPadding;
                      return (
                        <text key={i} x={x} y={svgHeight - 8} textAnchor="middle" className="text-[7.5px] fill-slate-450 font-bold">
                          {formatTrendLabel(pt.label, period)}
                        </text>
                      );
                    })}

                    {/* Polyline for Requests */}
                    <path
                      d={pointsReq.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                    />
                    {pointsReq.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3" fill="#94a3b8" className="hover:r-4 transition cursor-pointer">
                        <title>{`${formatTrendLabel(p.label, period)}: ${p.val} Requests Created`}</title>
                      </circle>
                    ))}

                    {/* Polyline for Donations */}
                    <path
                      d={pointsDon.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#e11d48"
                      strokeWidth="2"
                    />
                    {pointsDon.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3" fill="#e11d48" className="hover:r-4 transition cursor-pointer">
                        <title>{`${formatTrendLabel(p.label, period)}: ${p.val} Completed Donations`}</title>
                      </circle>
                    ))}
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* C. REQUEST JOURNEY / FUNNEL */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-455 border-b border-slate-100 pb-2">
                Request Journey Funnel
              </h3>
              
              <div className="space-y-4">
                {/* Funnel Steps */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-xxs font-bold text-slate-600 flex items-center justify-center">1</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-xxs font-bold text-slate-700">
                        <span>Requests Received</span>
                        <span className="font-mono text-slate-800">{funnel.received}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                        <div className="bg-slate-400 h-full rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 text-xxs font-bold text-brand-red flex items-center justify-center">2</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-xxs font-bold text-slate-700">
                        <span>Donor Response (Accepted)</span>
                        <span className="font-mono text-slate-800">{funnel.responded}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                        <div className="bg-brand-red h-full rounded-full" style={{ width: `${funnel.received > 0 ? (funnel.responded / funnel.received) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-50 border border-amber-100 text-xxs font-bold text-amber-700 flex items-center justify-center">3</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-xxs font-bold text-slate-700">
                        <span>In Active Coordination</span>
                        <span className="font-mono text-slate-800">{funnel.inCoordination}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${funnel.received > 0 ? (funnel.inCoordination / funnel.received) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-xxs font-bold text-emerald-700 flex items-center justify-center">4</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-xxs font-bold text-slate-700">
                        <span>Successfully Fulfilled</span>
                        <span className="font-mono text-slate-800">{funnel.fulfilled}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${funnel.received > 0 ? (funnel.fulfilled / funnel.received) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtext outcome summary statement */}
                <div className="text-xxs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                  <div>🎯 <strong>Journey Summary:</strong> {funnel.fulfilled} of {funnel.received} request{funnel.received === 1 ? '' : 's'} were successfully fulfilled.</div>
                  <div className="text-[10px] text-slate-400">
                    ❌ Unsuccessful Outcomes: {unsuccessful.cancelled} cancelled | {unsuccessful.rejected} rejected | {unsuccessful.noDonor} no donor found.
                  </div>
                </div>
              </div>
            </div>

            {/* E. DONOR PARTICIPATION */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-455 border-b border-slate-100 pb-2">
                Donor Participation Progression
              </h3>

              <div className="space-y-4.5">
                {/* Progression steps */}
                <div className="space-y-3 text-xxs font-semibold text-slate-650">
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 rounded-xl">
                    <span>Registered Donors (All Time)</span>
                    <strong className="text-slate-800 text-xs">{donorContribution.registeredDonors}</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 rounded-xl">
                    <span>Active Accounts</span>
                    <strong className="text-emerald-600 text-xs">{donorContribution.activeDonors}</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 rounded-xl">
                    <span>Donors Who Have Donated</span>
                    <strong className="text-purple-600 text-xs">{donorContribution.donatedDonors}</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 rounded-xl">
                    <span>Repeat Donors</span>
                    <strong className="text-brand-red text-xs">{donorContribution.repeatDonors}</strong>
                  </div>
                </div>

                {/* Progress interpretation */}
                <div className="text-xxs font-bold text-slate-700 bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-1">
                  <div>🧬 <strong>Activity Rate:</strong> {donorContribution.registeredDonors > 0 ? Math.round((donorContribution.donatedDonors / donorContribution.registeredDonors) * 100) : 0}% of registered donors have completed at least one donation.</div>
                  <div className="text-[10px] text-slate-450 font-semibold">
                    🔄 Repeat Donors count: {donorContribution.repeatDonors} donor{donorContribution.repeatDonors === 1 ? '' : 's'} contributed more than once.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* D. BLOOD GROUP REQUESTS & COMPLETED DONATIONS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-455">
                  Blood Group Requests & Completed Donations
                </h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                  Compare blood requests with completed donations by blood group.
                </p>
              </div>
              <div className="flex gap-4 items-center text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-blue-500 inline-block" />
                  Requests
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-red-600 inline-block" />
                  Completed Donations
                </span>
              </div>
            </div>

            {/* Grouped Vertical Bar Chart */}
            <div className="overflow-x-auto pt-2">
              <svg viewBox="0 0 550 210" className="w-full max-h-[220px] font-mono select-none">
                {/* Y-Axis Label */}
                <text
                  x="-95"
                  y="12"
                  transform="rotate(-90)"
                  textAnchor="middle"
                  className="text-[8px] font-bold fill-slate-400 font-sans"
                >
                  Number of records
                </text>

                {(() => {
                  const maxChartVal = Math.max(...processedBloodGroups.map(x => Math.max(x.requests, x.donations)), 1);
                  const chartHeight = 210;
                  const chartWidth = 550;
                  const padding = { left: 40, right: 15, top: 15, bottom: 25 };
                  const graphHeight = chartHeight - padding.top - padding.bottom;
                  const graphWidth = chartWidth - padding.left - padding.right;
                  const colWidth = graphWidth / 8;
                  const barWidth = 14;
                  const barGap = 3;

                  // Generate Ticks
                  const ticks = [];
                  const tickStep = Math.max(Math.ceil(maxChartVal / 5), 1);
                  for (let v = 0; v <= maxChartVal; v += tickStep) {
                    ticks.push(v);
                  }
                  if (!ticks.includes(maxChartVal)) {
                    ticks.push(maxChartVal);
                  }

                  return (
                    <>
                      {/* Grid Lines & Ticks */}
                      {ticks.map((t, idx) => {
                        const y = chartHeight - padding.bottom - (t / maxChartVal) * graphHeight;
                        return (
                          <g key={idx}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={chartWidth - padding.right}
                              y2={y}
                              stroke="#f1f5f9"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={padding.left - 8}
                              y={y + 3}
                              textAnchor="end"
                              className="text-[8px] font-bold fill-slate-400 font-sans"
                            >
                              {t}
                            </text>
                          </g>
                        );
                      })}

                      {/* Bar groups */}
                      {processedBloodGroups.map((item, i) => {
                        const centerX = padding.left + (i + 0.5) * colWidth;
                        const reqX = centerX - barWidth - barGap / 2;
                        const donX = centerX + barGap / 2;
                        const reqH = (item.requests / maxChartVal) * graphHeight;
                        const donH = (item.donations / maxChartVal) * graphHeight;
                        const reqY = chartHeight - padding.bottom - reqH;
                        const donY = chartHeight - padding.bottom - donH;

                        return (
                          <g key={item.blood_group}>
                            {/* X Axis Group Label */}
                            <text
                              x={centerX}
                              y={chartHeight - padding.bottom + 15}
                              textAnchor="middle"
                              className="text-[9px] font-black fill-slate-650 font-sans"
                            >
                              {item.blood_group}
                            </text>

                            {/* Requests Bar (Blue) */}
                            {item.requests > 0 && (
                              <g>
                                <rect
                                  x={reqX}
                                  y={reqY}
                                  width={barWidth}
                                  height={reqH}
                                  fill="#3b82f6"
                                  rx="2"
                                  className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                                >
                                  <title>{`${item.blood_group} - Requests: ${item.requests}`}</title>
                                </rect>
                                <text
                                  x={reqX + barWidth / 2}
                                  y={reqY - 4}
                                  textAnchor="middle"
                                  className="text-[8px] font-bold fill-slate-500 font-mono"
                                >
                                  {item.requests}
                                </text>
                              </g>
                            )}

                            {/* Completed Donations Bar (Red) */}
                            {item.donations > 0 && (
                              <g>
                                <rect
                                  x={donX}
                                  y={donY}
                                  width={barWidth}
                                  height={donH}
                                  fill="#ef4444"
                                  rx="2"
                                  className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                                >
                                  <title>{`${item.blood_group} - Completed Donations: ${item.donations}`}</title>
                                </rect>
                                <text
                                  x={donX + barWidth / 2}
                                  y={donY - 4}
                                  textAnchor="middle"
                                  className="text-[8px] font-bold fill-red-500 font-mono"
                                >
                                  {item.donations}
                                </text>
                              </g>
                            )}

                            {/* Zero Value Label Center Alignment */}
                            {item.requests === 0 && item.donations === 0 && (
                              <text
                                x={centerX}
                                y={chartHeight - padding.bottom - 6}
                                textAnchor="middle"
                                className="text-[8px] font-bold fill-slate-350 font-mono"
                              >
                                0
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Actual Request Status Interpretations */}
            <div className="space-y-2 pt-2 border-t border-slate-105">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Request Outcome Interpretations</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-150 rounded-xl p-3.5">
                {processedBloodGroups.map((item) => {
                  let msg = '';
                  let badgeClass = '';

                  if (item.requests === 0) {
                    msg = `No ${item.blood_group} requests in this period.`;
                    badgeClass = 'text-slate-455';
                  } else if (item.requests === item.fulfilled) {
                    msg = `✓ All ${item.blood_group} blood requests are fulfilled.`;
                    badgeClass = 'text-emerald-700 font-bold';
                  } else {
                    const parts = [];

                    // CASE 3: Some fulfilled + some cancelled, no other status
                    if (item.fulfilled > 0 && item.cancelled > 0 && item.fulfilled + item.cancelled === item.requests) {
                      const reqText = item.fulfilled === 1 ? 'request' : 'requests';
                      const canText = item.cancelled === 1 ? 'request' : 'requests';
                      msg = `${item.fulfilled} ${reqText} fulfilled · ${item.cancelled} ${canText} cancelled.`;
                      badgeClass = 'text-slate-700 font-semibold';
                    }
                    // CASE 4: fulfilled + active/pending, no other status
                    else if (item.fulfilled > 0 && item.active_pending > 0 && item.fulfilled + item.active_pending === item.requests) {
                      const reqText = item.fulfilled === 1 ? 'request' : 'requests';
                      const penText = item.active_pending === 1 ? 'request' : 'requests';
                      msg = `✓ ${item.fulfilled} ${reqText} fulfilled · ⚠️ ${item.active_pending} ${penText} still awaiting resolution.`;
                      badgeClass = 'text-amber-800 font-semibold';
                    }
                    // CASE 5: fulfilled + no donor found, no other status
                    else if (item.fulfilled > 0 && item.no_donor_found > 0 && item.fulfilled + item.no_donor_found === item.requests) {
                      const reqText = item.fulfilled === 1 ? 'request' : 'requests';
                      const ndText = item.no_donor_found === 1 ? 'request' : 'requests';
                      msg = `✓ ${item.fulfilled} ${reqText} fulfilled · ⚠️ ${item.no_donor_found} ${ndText} received no donor.`;
                      badgeClass = 'text-amber-850 font-semibold';
                    }
                    // CASE 6: fulfilled + rejected, no other status
                    else if (item.fulfilled > 0 && item.rejected > 0 && item.fulfilled + item.rejected === item.requests) {
                      const reqText = item.fulfilled === 1 ? 'request' : 'requests';
                      const rejText = item.rejected === 1 ? 'request' : 'requests';
                      msg = `✓ ${item.fulfilled} ${reqText} fulfilled · ${item.rejected} ${rejText} rejected.`;
                      badgeClass = 'text-slate-700 font-semibold';
                    }
                    // CASE 7: Multiple outcomes (general fallback)
                    else {
                      if (item.fulfilled > 0) {
                        parts.push(`${item.fulfilled} fulfilled`);
                      }
                      if (item.cancelled > 0) {
                        parts.push(`${item.cancelled} cancelled`);
                      }
                      if (item.active_pending > 0) {
                        parts.push(`${item.active_pending} awaiting resolution`);
                      }
                      if (item.no_donor_found > 0) {
                        parts.push(`${item.no_donor_found} received no donor`);
                      }
                      if (item.rejected > 0) {
                        parts.push(`${item.rejected} rejected`);
                      }

                      const hasAlert = item.active_pending > 0 || item.no_donor_found > 0;
                      msg = (hasAlert ? '⚠️ ' : '') + parts.join(' · ') + '.';
                      badgeClass = hasAlert ? 'text-amber-800 font-semibold' : 'text-slate-700 font-semibold';
                    }
                  }

                  return (
                    <div key={item.blood_group} className="text-[10px] space-y-0.5">
                      <span className="block font-black text-slate-700">{item.blood_group}</span>
                      <span className={badgeClass}>{msg}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* F. COORDINATOR WORKLOAD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-455 border-b border-slate-100 pb-2">
              Coordinator Case Workload
            </h3>
            
            {/* Workload Table */}
            <div className="hidden sm:block overflow-hidden border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xxs font-semibold text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold uppercase tracking-wider text-slate-455 font-sans">
                    <th className="px-5 py-3">Coordinator Name</th>
                    <th className="px-4 py-3 text-center">Active Workload</th>
                    <th className="px-4 py-3 text-center">Completed Cases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coordinatorWorkload.map((row) => (
                    <tr key={row.coordinator_name} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-800">{row.coordinator_name}</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-600">
                        <span className={`px-2 py-0.5 rounded-full ${
                          row.active_cases > 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {row.active_cases} Active
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-650">{row.completed_cases} Cases</td>
                    </tr>
                  ))}
                  {coordinatorWorkload.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-5 py-4 text-center text-slate-400 italic">No coordinators currently active.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Workload cards */}
            <div className="sm:hidden grid gap-2.5">
              {coordinatorWorkload.map((row) => (
                <div key={row.coordinator_name} className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex justify-between items-center text-xxs font-semibold">
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase">Coordinator</span>
                    <strong className="text-slate-800">{row.coordinator_name}</strong>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase">Active</span>
                      <strong className={`text-xs font-mono block mt-0.5 ${row.active_cases > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{row.active_cases}</strong>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase">Completed</span>
                      <strong className="text-slate-750 text-xs font-mono block mt-0.5">{row.completed_cases}</strong>
                    </div>
                  </div>
                </div>
              ))}
              {coordinatorWorkload.length === 0 && (
                <div className="text-center text-slate-400 italic text-xxs py-4">No coordinators currently active.</div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}