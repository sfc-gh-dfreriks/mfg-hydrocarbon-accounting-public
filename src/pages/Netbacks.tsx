import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import MetricCard, { Gauge, CurrencyIcon, Activity, TrendingDown } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import PageState from '@/components/PageState';

const pb = (v: any) => (v == null ? '–' : `$${Number(v).toFixed(2)}`);
const COLORS = ['#0f766e', '#7c3aed', '#f59e0b', '#0ea5e9', '#ef4444'];
const PARTS = [['deductions', 'Deductions', '#fdba74'], ['sevTax', 'Severance tax', '#fca5a5'], ['royalty', 'Royalty', '#c4b5fd'],
               ['loe', 'LOE', '#94a3b8'], ['netback', 'Netback', '#10b981']] as const;

export default function Netbacks() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('netbacks', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const basins: any[] = data?.byBasin ?? [];
  const trend: any[] = data?.trend ?? [];
  const months = [...new Set(trend.map((r) => r.month))];
  const names = [...new Set(trend.map((r) => r.basin))];
  const pt = data?.priceTrend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Netback" value={`${pb(k.netback)}/BOE`} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="8/8, after royalty, tax, deductions and LOE" deltaType="neutral" />
          <MetricCard title="Revenue" value={`${pb(k.revenue)}/BOE`} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`WTI averaged ${pb(k.wti)}/BBL`} deltaType="neutral" />
          <MetricCard title="LOE" value={`${pb(k.loe)}/BOE`} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`Royalty ${pb(k.royalty)} · tax ${pb(k.sevTax)} · deductions ${pb(k.deductions)}`} deltaType="neutral" />
          <MetricCard title="BOE Sold" value={`${(Number(k.boe ?? 0) / 1e6).toFixed(2)} MMBOE`} icon={Activity} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Valued volume" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Revenue per BOE and Where It Goes, by Basin" subtitle="Ranked by netback, $/BOE" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, legend: { top: 0 }, grid: { left: 140, right: 30, bottom: 30, top: 40 },
              yAxis: { type: 'category', inverse: true, data: basins.map((b) => b.name) }, xAxis: { type: 'value', name: '$/BOE' },
              series: PARTS.map(([key, name, color]) => ({ name, type: 'bar', stack: 'n', data: basins.map((b) => b[key]?.toFixed?.(2)), itemStyle: { color } })),
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Netback by Month" subtitle="$/BOE by basin">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 50, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: months }, yAxis: { type: 'value', name: '$/BOE' },
              series: names.map((n, i) => ({ name: n, type: 'line', smooth: true, itemStyle: { color: COLORS[i % 5] },
                data: months.map((m) => trend.find((r) => r.month === m && r.basin === n)?.netback?.toFixed?.(2) ?? null) })),
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Realized Oil Price vs WTI Cushing" subtitle="USD/BBL">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 50, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: pt.map((r: any) => r.month) }, yAxis: { type: 'value', scale: true },
              series: [{ name: 'WTI Cushing', type: 'line', smooth: true, data: pt.map((r: any) => r.wti?.toFixed?.(2)), itemStyle: { color: '#94a3b8' } },
                       { name: 'Realized oil', type: 'line', smooth: true, data: pt.map((r: any) => r.realizedOil?.toFixed?.(2)), itemStyle: { color: '#0f766e' } }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Unit Economics by Basin" subtitle="$/BOE" className="lg:col-span-2">
            <DataTable data={basins} columns={[
              { key: 'name', label: 'Basin' }, { key: 'boe', label: 'BOE sold', format: formatNumber }, { key: 'revenue', label: 'Revenue', format: pb },
              { key: 'deductions', label: 'Deductions', format: pb }, { key: 'sevTax', label: 'Sev. tax', format: pb }, { key: 'royalty', label: 'Royalty', format: pb },
              { key: 'loe', label: 'LOE', format: pb }, { key: 'netback', label: 'Netback', format: pb },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
