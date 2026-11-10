import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Gauge, Receipt, TrendingDown } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

export default function Loe() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('loe', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Lease Operating Expense" value={formatDollar(k.loe)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50"
            delta={data?.perBoe?.loeBoe == null ? 'Per BOE needs volumes (ECC or S/4HANA)' : `$${Number(data.perBoe.loeBoe).toFixed(2)} per BOE sold`} deltaType="neutral" />
          <MetricCard title="Tickets Matched to Invoices" value={formatPct(k.matchPct)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="Invoice within $1 of its approved field tickets" deltaType="neutral" />
          <MetricCard title="Overbilled vs Tickets" value={formatDollar(k.overbilled)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatNumber(k.overbilledN)} invoices above approved tickets`} deltaType="negative" />
          <MetricCard title="Unbilled LOE (Accrual)" value={formatDollar(k.unbilled)} icon={Receipt} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-yellow-50" delta={`${formatNumber(k.unbilledN)} approved tickets with no invoice yet`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="LOE by Service Month" subtitle="Invoiced vs accrued from approved tickets, USD" className="lg:col-span-2">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ name: 'Invoiced', type: 'bar', stack: 'l', data: trend.map((r: any) => r.billed), itemStyle: { color: '#0ea5e9' } },
                       { name: 'Unbilled (ticket accrual)', type: 'bar', stack: 'l', data: trend.map((r: any) => r.unbilled), itemStyle: { color: '#fbbf24' } }],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="LOE by Cost Category" subtitle="USD">
            <Bars rows={data?.byCategory ?? []} label="name" value="value" color="#0ea5e9" height={280} leftPad={190} />
          </ChartCard>
          <ChartCard title="Overbilling by Vendor" subtitle="Invoice amount above approved tickets, USD">
            <Bars rows={data?.overbilledByVendor ?? []} label="name" value="value" color="#ef4444" height={280} leftPad={210} />
          </ChartCard>
          <ChartCard title="Ticket-to-Invoice Match" subtitle="Field tickets matched to SAP invoices on the vendor invoice number">
            <DataTable data={data?.status ?? []} columns={[
              { key: 'name', label: 'Status' }, { key: 'items', label: 'Items', format: formatNumber }, { key: 'value', label: 'LOE', format: formatDollar },
            ]} />
          </ChartCard>
          <ChartCard title="Largest Overbilled Invoices">
            <DataTable data={data?.topOverbilled ?? []} columns={[
              { key: 'vendor', label: 'Vendor' }, { key: 'well', label: 'Well' }, { key: 'category', label: 'Category' },
              { key: 'tickets', label: 'Tickets', format: formatDollar }, { key: 'invoice', label: 'Invoice', format: formatDollar }, { key: 'value', label: 'Over', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
