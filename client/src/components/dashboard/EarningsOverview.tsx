import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format, startOfToday, startOfWeek, startOfMonth, endOfToday, endOfWeek, endOfMonth } from 'date-fns';
import { Tip } from "@shared/schema";

export function EarningsOverview() {
  const today = startOfToday();
  const endToday = endOfToday();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const { data: tips, isLoading } = useQuery<Tip[]>({
    queryKey: ['/api/tips'],
  });

  const calculateEarnings = (startDate: Date, endDate: Date) => {
    if (!tips) return 0;
    
    return tips
      .filter(tip => {
        const tipDate = new Date(tip.date);
        return tipDate >= startDate && tipDate <= endDate;
      })
      .reduce((total, tip) => total + tip.amount, 0);
  };

  const todayEarnings = calculateEarnings(today, endToday);
  const weekEarnings = calculateEarnings(weekStart, weekEnd);
  const monthEarnings = calculateEarnings(monthStart, monthEnd);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800">Total Earnings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EarningCard title="Today" amount={todayEarnings} isLoading={isLoading} />
          <EarningCard title="This Week" amount={weekEarnings} isLoading={isLoading} />
          <EarningCard title="This Month" amount={monthEarnings} isLoading={isLoading} />
        </div>
      </CardContent>
    </Card>
  );
}

interface EarningCardProps {
  title: string;
  amount: number;
  isLoading: boolean;
}

function EarningCard({ title, amount, isLoading }: EarningCardProps) {
  return (
    <div className="border border-gray-100 rounded-lg p-4 flex flex-col">
      <span className="text-sm text-gray-500 mb-1">{title}</span>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <span className="text-2xl font-medium text-gray-800">
          ${amount.toFixed(2)}
        </span>
      )}
    </div>
  );
}
