import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import MetricCard, { Activity, Gauge, TrendingUp, Calendar } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const boe = (v: any) => (v == null ? '–' : `${formatNumber(Math.round(Number(v)))} BOE`);
const m = (v: any, u: string) => (v == null ? '–' : `${(Number(v) / 1e6).toFixed(2)} MM${u}`);

export default function Production() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('production', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  const none = !loading && !k.boe;
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        {none && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          No volumes: the selected SAP source has no IS-Oil upstream volumes (SAP BW and SAP BDC have no UHPM data products). Select ECC or S/4HANA on Data Sources.</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Allocated Production" value={m(k.boe, 'BOE')} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(k.wells)} producing wells`} deltaType="neutral" />
          <MetricCard title="Oil" value={m(k.oil, 'BBL')} icon={TrendingUp} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`NGL ${m(k.ngl, 'BBL')}`} deltaType="neutral" />
          <MetricCard title="Gas" value={k.gas == null ? '–' : `${(Number(k.gas) / 1e6).toFixed(2)} BCF`} icon={Gauge} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="Henry Hub / Waha / HSC priced" deltaType="neutral" />
          <MetricCard title="Allocation Adjustment" value={boe(k.adjBoe)} icon={Calendar} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-yellow-50" delta="Allocated less measured (battery factors)" deltaType={k.adjBoe < 0 ? 'negative' : 'neutral'} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Production by Month and Product" subtitle="Allocated BOE (gas / 6)" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: { type: 'value', name: 'BOE' },
              series: [
                { name: 'Oil', type: 'bar', stack: 'p', data: trend.map((r: any) => r.oil), itemStyle: { color: '#0f766e' } },
                { name: 'Gas', type: 'bar', stack: 'p', data: trend.map((r: any) => r.gas), itemStyle: { color: '#f59e0b' } },
                { name: 'NGL', type: 'bar', stack: 'p', data: trend.map((r: any) => r.ngl), itemStyle: { color: '#8b5cf6' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Production by Basin" subtitle="Allocated BOE">
            <Bars rows={data?.byBasin ?? []} label="name" value="boe" color="#0f766e" height={260} format={boe} />
          </ChartCard>
          <ChartCard title="Production by Field" subtitle="Allocated BOE, top 12">
            <Bars rows={data?.byField ?? []} label="name" value="boe" color="#14b8a6" height={260} format={boe} />
          </ChartCard>
          <ChartCard title="Top Wells" subtitle="24 months, allocated" className="lg:col-span-2">
            <DataTable data={data?.topWells ?? []} columns={[
              { key: 'well', label: 'Well' }, { key: 'basin', label: 'Basin' }, { key: 'boe', label: 'BOE', format: boe },
              { key: 'oil', label: 'Oil (BBL)', format: formatNumber }, { key: 'gas', label: 'Gas (MCF)', format: formatNumber },
              { key: 'daysOn', label: 'Avg days on', format: (v: any) => (v == null ? '–' : Number(v).toFixed(1)) },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
