import { HistoryTable } from '@/components/history/history-table';

export default function HistoryPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">سجل العمليات</h1>
      </div>
      <HistoryTable />
    </div>
  );
}
