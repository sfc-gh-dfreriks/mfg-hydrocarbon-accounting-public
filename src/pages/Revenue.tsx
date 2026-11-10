import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Users, Receipt, TrendingDown } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const px = (v: any) => (v == null ? '–' : `$${Number(v).toFixed(2)}`);

export default function Revenue() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('revenue', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const w = data?.waterfall ?? {};
  const oil = (data?.priceTrend ?? []).filter((r: any) => r.product === 'OIL');
  // Gross-to-net waterfall: each step floats on what is left after it.
  const steps = [['Gross value', w.gross, 0], ['Deductions', w.deductions, 1], ['Severance tax', w.sevTax, 1], ['Royalty & ORRI', w.royalty, 1],
                 ['Partner WI', w.partnerWi, 1], ['Company net', w.companyNet, 0]] as [string, number, number][];
  let left = Number(w.gross ?? 0);
  const base = steps.map(([, v, d]) => { if (!d) return 0; left -= Number(v ?? 0); return left; });
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        {!loading && !k.gross && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          No valuation: PRA valuation and owner distribution are IS-Oil objects with no SAP BW or SAP BDC equivalent. Revenue is still in the GL (Executive Dashboard).</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Gross Revenue" value={formatDollar(k.gross)} icon={CurrencyIcon} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`Oil ${px(k.oilPrice)}/BBL · gas ${px(k.gasPrice)}/MCF realized`} deltaType="neutral" />
          <MetricCard title="Royalties & ORRI" value={formatDollar(k.royalty)} icon={Users} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatDollar(k.ownerDist)} distributed to all owners`} deltaType="neutral" />
          <MetricCard title="Severance Tax" value={formatDollar(k.sevTax)} icon={Receipt} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`${formatDollar(k.deductions)} transport & processing`} deltaType="neutral" />
          <MetricCard title="Held in Suspense" value={formatDollar(k.suspended)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta="Owner revenue not paid: address, title, minimum pay" deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Gross to Net" subtitle="Where each revenue dollar goes, USD">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[1].name}: ${formatDollar(p[1].value)}` },
              grid: { left: 70, right: 20, bottom: 30, top: 20 }, xAxis: { type: 'category', data: steps.map((s) => s[0]), axisLabel: { fontSize: 10 } },
              yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ type: 'bar', stack: 'w', data: base, itemStyle: { color: 'transparent' } },
                       { type: 'bar', stack: 'w', data: steps.map(([, v, d]) => ({ value: v, itemStyle: { color: d ? '#f97316' : '#10b981' } })), barMaxWidth: 50 }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Realized Oil Price vs Hub" subtitle="Volume-weighted, USD/BBL">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 50, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: oil.map((r: any) => r.month) }, yAxis: { type: 'value', scale: true },
              series: [{ name: 'Hub benchmark', type: 'line', smooth: true, data: oil.map((r: any) => r.benchmark?.toFixed?.(2)), itemStyle: { color: '#94a3b8' } },
                       { name: 'Realized', type: 'line', smooth: true, data: oil.map((r: any) => r.realized?.toFixed?.(2)), itemStyle: { color: '#0f766e' } }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Revenue by Purchaser" subtitle="Gross value, USD">
            <Bars rows={data?.byPurchaser ?? []} label="name" value="gross" color="#10b981" height={300} leftPad={210} />
          </ChartCard>
          <ChartCard title="Price Differential to Hub" subtitle="Realized less benchmark, USD per BBL / MCF (most negative first)">
            <Bars rows={(data?.differentials ?? []).map((r: any) => ({ ...r, gap: -(r.diff ?? 0) }))} label="name" value="gap" color="#f97316" height={300}
              format={(v: number) => `-$${Number(v).toFixed(2)}`} leftPad={170} />
          </ChartCard>
          <ChartCard title="Owner Suspense by Reason" subtitle="Net owner revenue held, USD">
            <Bars rows={data?.suspense ?? []} label="name" value="value" color="#ef4444" height={220} />
          </ChartCard>
          <ChartCard title="Paid to Owners by Type" subtitle="Net owner revenue, USD">
            <Bars rows={data?.ownerTypes ?? []} label="name" value="value" color="#29b5e8" height={220} leftPad={200} />
          </ChartCard>
          <ChartCard title="Largest Owner Suspense Balances" subtitle="Excluding minimum-pay holds" className="lg:col-span-2">
            <DataTable data={data?.topSuspended ?? []} columns={[
              { key: 'owner', label: 'Owner' }, { key: 'type', label: 'Type' }, { key: 'reason', label: 'Reason' },
              { key: 'wells', label: 'Wells', format: formatNumber }, { key: 'value', label: 'Held', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
