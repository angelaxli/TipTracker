
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tip } from "@shared/schema";
import { AlertCircle, TrendingUp, Clock, DollarSign } from "lucide-react";

interface AIInsightsProps {
  tips: Tip[];
  isLoading: boolean;
}

export function AIInsights({ tips, isLoading }: AIInsightsProps) {
  const insights = useMemo(() => {
    if (!tips.length) return null;

    // Calculate optimal shift recommendations
    const hourlyEarnings = new Map<number, { total: number; count: number }>();
    tips.forEach(tip => {
      const hour = new Date(tip.date).getHours();
      const current = hourlyEarnings.get(hour) || { total: 0, count: 0 };
      hourlyEarnings.set(hour, {
        total: current.total + tip.amount,
        count: current.count + 1
      });
    });

    const bestHours = Array.from(hourlyEarnings.entries())
      .map(([hour, data]) => ({
        hour,
        average: data.total / data.count
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 3);

    // Calculate customer behavior patterns
    const patterns = tips.reduce((acc, tip) => {
      const amount = tip.amount;
      if (amount > acc.highestTip) acc.highestTip = amount;
      acc.totalTips += amount;
      acc.count++;
      return acc;
    }, { highestTip: 0, totalTips: 0, count: 0 });

    // Generate personalized recommendations
    const recommendations = [
      {
        title: "Optimal Shift Times",
        description: `Your highest earning hours are ${bestHours
          .map(h => `${h.hour}:00`)
          .join(", ")} with average tips of $${bestHours[0].average.toFixed(2)}/hr`,
        icon: Clock
      },
      {
        title: "Income Optimization",
        description: `Focus on ${tips[0]?.source || 'cash'} payments - they make up the majority of your higher tips`,
        icon: DollarSign
      },
      {
        title: "Growth Potential",
        description: `Your current average of $${(patterns.totalTips / patterns.count).toFixed(2)} could increase by focusing on peak hours`,
        icon: TrendingUp
      },
      {
        title: "Risk Management",
        description: "Consider diversifying payment methods to optimize earnings across different customer preferences",
        icon: AlertCircle
      }
    ];

    return { recommendations, patterns };
  }, [tips]);

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!insights) {
    return <div>No data available for analysis</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Earnings Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <rec.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{rec.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
