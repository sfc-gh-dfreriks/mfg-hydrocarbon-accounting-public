import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { Activity, TrendingDown, Gauge, Calendar } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const mm = (v: any) => (v == null ? '–' : `${(Number(v) / 1e6).toFixed(2)} MMBOE`);

export default function Recon() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('recon', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        {!loading && !k.allocatedBoe && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Nothing to reconcile: allocated volumes and PRA valuation are IS-Oil objects that SAP BW and SAP BDC do not supply.</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Allocated vs Valued" value={`${mm(k.allocatedBoe)} / ${mm(k.valuedBoe)}`} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="UHPM allocated vs PRA valued" deltaType="neutral" />
          <MetricCard title="Revenue at Risk" value={formatDollar(k.atRisk)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatNumber(k.gapBoe)} BOE allocated but not valued`} deltaType="negative" />
          <MetricCard title="Well-Months Reconciled" value={formatPct(k.reconciledPct)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="Valued within 0.5% of allocated" deltaType="neutral" />
          <MetricCard title="Pending (Accounting Lag)" value={`${formatNumber(k.pendingBoe)} BOE`} icon={Calendar} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Oil and NGL value one month after production, gas two" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Revenue at Risk by Production Month" subtitle="Unvalued and partially valued volume, USD" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ name: 'Unvalued', type: 'bar', stack: 'r', data: trend.map((r: any) => r.unvalued), itemStyle: { color: '#ef4444' } },
                       { name: 'Partially valued', type: 'bar', stack: 'r', data: trend.map((r: any) => r.partial), itemStyle: { color: '#fdba74' } }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Likely Cause" subtitle="Revenue at risk, USD">
            <Bars rows={data?.causes ?? []} label="name" value="value" color="#ef4444" height={220} leftPad={240} />
          </ChartCard>
          <ChartCard title="Revenue at Risk by Basin" subtitle="USD">
            <Bars rows={data?.byBasin ?? []} label="name" value="value" color="#f97316" height={220} />
          </ChartCard>
          <ChartCard title="Reconciliation Status" subtitle="Well x product x month">
            <DataTable data={data?.byStatus ?? []} columns={[
              { key: 'name', label: 'Status' }, { key: 'lines', label: 'Well-months', format: formatNumber },
              { key: 'boe', label: 'BOE gap', format: formatNumber }, { key: 'value', label: 'At risk', format: formatDollar },
            ]} />
          </ChartCard>
          <ChartCard title="Largest Volume-to-Revenue Gaps">
            <DataTable data={data?.topGaps ?? []} columns={[
              { key: 'well', label: 'Well' }, { key: 'product', label: 'Product' }, { key: 'month', label: 'Month' }, { key: 'status', label: 'Status' },
              { key: 'allocated', label: 'Allocated', format: formatNumber }, { key: 'valued', label: 'Valued', format: formatNumber }, { key: 'value', label: 'At risk', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
