import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber } from '@/lib/utils';
import MetricCard, { FileText, TrendingDown, Users, Building2 } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const dec = (v: any) => (v == null ? '–' : Number(v).toFixed(8));
const LABEL: Record<string, string> = { DECIMAL_MISMATCH: 'Decimal mismatch', MISSING_IN_DOI: 'Owner missing from DOI', NOT_IN_LEASE_DECK: 'Owner not in land deck' };

export default function DivisionOrders() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('division-orders', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        {k.notAvailable > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Division orders are not available from the selected SAP source (SAP BW and SAP BDC carry no PRA division orders), so the land deck cannot be reconciled.</div>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="DOI Exceptions" value={formatNumber(k.exceptions)} icon={FileText} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-yellow-50" delta={`${formatNumber(k.wells)} wells · ${formatNumber(k.lines)} owner lines compared`} deltaType="neutral" />
          <MetricCard title="Revenue at Risk" value={formatDollar(k.atRisk)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta="Decimal difference x well net value" deltaType="negative" />
          <MetricCard title="Owners Underpaid" value={formatDollar(k.underpaid)} icon={Users} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="vs the land deck: exposure to owner claims and interest" deltaType="negative" />
          <MetricCard title="Owners Overpaid" value={formatDollar(k.overpaid)} icon={Building2} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="Recoverable through prior-period adjustments" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Exceptions by Type" subtitle="Revenue at risk, USD">
            <Bars rows={(data?.byType ?? []).map((r: any) => ({ ...r, name: LABEL[r.name] ?? r.name }))} label="name" value="value" color="#f59e0b" height={220} leftPad={190} />
          </ChartCard>
          <ChartCard title="Exceptions by Basin" subtitle="Revenue at risk, USD">
            <Bars rows={data?.byBasin ?? []} label="name" value="value" color="#ef4444" height={220} />
          </ChartCard>
          <ChartCard title="Division Order vs Land Deck: Largest Exceptions" subtitle="SAP PRA decimal vs the land system of record" className="lg:col-span-2">
            <DataTable data={(data?.exceptions ?? []).map((r: any) => ({ ...r, type: LABEL[r.type] ?? r.type }))} columns={[
              { key: 'well', label: 'Well' }, { key: 'basin', label: 'Basin' }, { key: 'owner', label: 'Owner' }, { key: 'interest', label: 'Interest' },
              { key: 'type', label: 'Exception' }, { key: 'doi', label: 'DOI decimal', format: dec }, { key: 'deck', label: 'Land deck', format: dec },
              { key: 'value', label: 'At risk', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
