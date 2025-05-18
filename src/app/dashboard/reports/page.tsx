import { HistoryTable } from '@/components/history/history-table';

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">التقارير</h1>
      </div>
      <HistoryTable />
    </div>
  );
}
