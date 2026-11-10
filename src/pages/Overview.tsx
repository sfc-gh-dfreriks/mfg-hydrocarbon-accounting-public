import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Activity, TrendingDown, Gauge } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const perBoe = (v: any) => (v == null ? '–' : `$${Number(v).toFixed(2)}/BOE`);
const mboe = (v: any) => (v == null ? '–' : `${(Number(v) / 1e6).toFixed(2)} MMBOE`);

export default function Overview() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('overview', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  const leak = (data?.leakage ?? []).reduce((s: number, r: any) => s + (r.value ?? 0), 0);
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="What We Produced" value={mboe(k.boe)} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50"
            delta={`${formatNumber(k.wells)} wells · allocated volumes`} deltaType="neutral" />
          <MetricCard title="What We Got Paid" value={formatDollar(k.gross ?? k.glRevenue)} icon={CurrencyIcon} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50"
            delta={k.gross == null ? 'GL revenue only: valuation not available from the selected SAP source' : `${formatDollar(k.royalty)} royalty · ${formatDollar(k.sevTax)} severance tax`} deltaType="neutral" />
          <MetricCard title="Netback" value={perBoe(k.netback)} icon={Gauge} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50"
            delta={`LOE ${perBoe(k.loeBoe)} · company net ${formatDollar(k.companyNet)}`} deltaType="neutral" />
          <MetricCard title="Revenue Leaking" value={formatDollar(leak)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50"
            delta={`plus ${formatDollar(k.suspense)} owner revenue held in suspense`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Production, Revenue and Netback by Month" className="lg:col-span-2" subtitle="Production month; revenue from PRA valuation (GL revenue when valuation is a source gap)">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, { type: 'value', name: '$/BOE' }],
              series: [
                { name: 'Gross revenue', type: 'bar', data: trend.map((r: any) => r.gross ?? r.glRevenue), itemStyle: { color: '#a5f3fc' } },
                { name: 'Netback $/BOE', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.netback?.toFixed?.(2)), itemStyle: { color: '#7c3aed' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Where Revenue Is Leaking" subtitle="Revenue at risk, USD, largest first">
            <Bars rows={data?.leakage ?? []} label="name" value="value" color="#ef4444" height={280} leftPad={200} />
          </ChartCard>
          <ChartCard title="Revenue by Basin" subtitle="Gross revenue, USD">
            <Bars rows={(data?.byBasin ?? []).map((r: any) => ({ ...r, v: r.gross ?? r.glRevenue }))} label="name" value="v" color="#29b5e8" height={280} />
          </ChartCard>
          <ChartCard title="Netback by Basin" subtitle="$/BOE after deductions, severance tax, royalty and LOE">
            <Bars rows={data?.byBasin ?? []} label="name" value="netback" color="#7c3aed" height={260} format={perBoe} />
          </ChartCard>
          <ChartCard title="Revenue by Source System" subtitle="GL revenue: one canonical model across the selected SAP sources">
            <Bars rows={data?.bySource ?? []} label="name" value="value" color="#0ea5e9" height={260} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
