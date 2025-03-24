import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfWeek, startOfMonth, subMonths, addDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from "recharts";
import { tipSources } from "@shared/schema";
import type { TipSource } from "@shared/schema";

// Get display name for tip source
const getSourceDisplayName = (source: string) => {
  switch(source) {
    case 'credit_card': return 'Credit Card';
    default: return source.charAt(0).toUpperCase() + source.slice(1);
  }
};

interface TipTrendsOverTimeProps {
  tips: any[] | undefined;
  isLoading: boolean;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function TipTrendsOverTime({ tips, isLoading, dateRange }: TipTrendsOverTimeProps) {
  const [timeSegment, setTimeSegment] = useState<"daily" | "weekly" | "monthly">("daily");
  const [chartType, setChartType] = useState<"line" | "area">("line");
  const [showTrendline, setShowTrendline] = useState<boolean>(true);
  
  // If loading or no tips
  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!tips || tips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tip Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">No tip data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Generate time intervals based on selected segment
  const generateTimeIntervals = () => {
    switch (timeSegment) {
      case 'daily':
        return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      case 'weekly':
        return eachWeekOfInterval(
          { start: dateRange.from, end: dateRange.to },
          { weekStartsOn: 0 } // 0 = Sunday
        );
      case 'monthly':
        return eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
      default:
        return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    }
  };

  const intervals = generateTimeIntervals();

  // Format date based on segment
  const formatDate = (date: Date) => {
    switch (timeSegment) {
      case 'daily':
        return format(date, 'MMM d');
      case 'weekly':
        return `Week ${format(date, 'w')}`;
      case 'monthly':
        return format(date, 'MMM yyyy');
      default:
        return format(date, 'MMM d');
    }
  };

  // Prepare data for visualization
  const chartData = intervals.map(interval => {
    // Filter tips based on the current interval
    let intervalTips;
    
    if (timeSegment === 'daily') {
      // For daily, get tips from this specific day
      intervalTips = tips.filter(tip => {
        const tipDate = parseISO(tip.date);
        return format(tipDate, 'yyyy-MM-dd') === format(interval, 'yyyy-MM-dd');
      });
    } else if (timeSegment === 'weekly') {
      // For weekly, get tips from this week
      const weekEnd = addDays(interval, 6);
      intervalTips = tips.filter(tip => {
        const tipDate = parseISO(tip.date);
        return tipDate >= interval && tipDate <= weekEnd;
      });
    } else {
      // For monthly, get tips from this month
      intervalTips = tips.filter(tip => {
        const tipDate = parseISO(tip.date);
        return format(tipDate, 'yyyy-MM') === format(interval, 'yyyy-MM');
      });
    }
    
    // Calculate total tip amount for this interval
    const totalAmount = intervalTips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0);
    
    // Calculate average tip amount for this interval
    const avgAmount = intervalTips.length > 0
      ? totalAmount / intervalTips.length
      : 0;
    
    // Get tip counts by source
    const sourceData = tipSources.reduce((acc, source) => {
      acc[source] = intervalTips.filter(tip => tip.source === source).length;
      return acc;
    }, {} as Record<string, number>);
    
    // Get tip amounts by source
    const sourceAmounts = tipSources.reduce((acc, source) => {
      const sourceTips = intervalTips.filter(tip => tip.source === source);
      acc[`${source}Amount`] = sourceTips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      date: formatDate(interval),
      rawDate: interval,
      tipCount: intervalTips.length,
      totalAmount,
      avgAmount,
      ...sourceData,
      ...sourceAmounts
    };
  });

  // Calculate the trend line (linear regression)
  const calculateTrendLine = () => {
    const n = chartData.length;
    if (n < 2) return { slope: 0, intercept: 0 };

    // Convert dates to numeric values (days since epoch)
    const xValues = chartData.map((d, i) => i);
    const yValues = chartData.map(d => d.totalAmount);

    // Calculate means
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Generate trend line points
    return chartData.map((d, i) => ({
      date: d.date,
      trendValue: intercept + slope * i
    }));
  };

  const trendLineData = calculateTrendLine();

  // Calculate percent change from first to last data point
  const calculatePercentChange = () => {
    if (chartData.length < 2) return 0;
    
    const firstValue = chartData[0].totalAmount;
    const lastValue = chartData[chartData.length - 1].totalAmount;
    
    if (firstValue === 0) return 0;
    return ((lastValue - firstValue) / firstValue) * 100;
  };

  const percentChange = calculatePercentChange();

  // Calculate overall trend
  const trend = percentChange > 1 ? "increasing" : percentChange < -1 ? "decreasing" : "stable";

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Tip Trends Over Time</CardTitle>
        <div className="flex gap-2">
          <Tabs 
            value={timeSegment} 
            onValueChange={(v) => setTimeSegment(v as "daily" | "weekly" | "monthly")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto"
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs 
            value={chartType} 
            onValueChange={(v) => setChartType(v as "line" | "area")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="line" className="text-xs">Line</TabsTrigger>
              <TabsTrigger value="area" className="text-xs">Area</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', dy: 50 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Count', angle: 90, position: 'insideRight', dy: 40 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'totalAmount' || name.includes('Amount')) {
                      return [`$${value.toFixed(2)}`, name === 'totalAmount' ? 'Total Amount' : `${name.replace('Amount', '')}`];
                    } else if (name === 'avgAmount') {
                      return [`$${value.toFixed(2)}`, 'Average Tip'];
                    } else if (name === 'tipCount') {
                      return [value, 'Tip Count'];
                    } else if (name === 'trendValue') {
                      return [`$${value.toFixed(2)}`, 'Trend'];
                    } else {
                      return [value, getSourceDisplayName(name)];
                    }
                  }}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="totalAmount" 
                  stroke="#8884d8" 
                  name="Total Amount"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgAmount" 
                  stroke="#82ca9d" 
                  name="Average Tip"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="tipCount" 
                  stroke="#ffc658" 
                  name="Tip Count"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />

                {showTrendline && trendLineData.map((d, index) => (
                  <Line
                    key={index}
                    yAxisId="left"
                    type="monotone"
                    dataKey="trendValue"
                    data={[trendLineData[0], trendLineData[trendLineData.length - 1]]}
                    stroke="#ff7300"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    name="Trend"
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', dy: 50 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'totalAmount') {
                      return [`$${value.toFixed(2)}`, 'Total Amount'];
                    } else if (name.includes('Amount')) {
                      const source = name.replace('Amount', '');
                      return [`$${value.toFixed(2)}`, getSourceDisplayName(source)];
                    } else {
                      return [value, name];
                    }
                  }}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />

                {tipSources.map((source, index) => (
                  <Area
                    key={index}
                    type="monotone"
                    dataKey={`${source}Amount`}
                    name={getSourceDisplayName(source)}
                    stroke={['#8884d8', '#82ca9d', '#ffc658', '#ff8042'][index % 4]}
                    fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8042'][index % 4]}
                    fillOpacity={0.3}
                    stackId="1"
                  />
                ))}

                {showTrendline && (
                  <ReferenceLine
                    stroke="#ff7300"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    segment={[
                      { x: chartData[0]?.date, y: trendLineData[0]?.trendValue },
                      { x: chartData[chartData.length - 1]?.date, y: trendLineData[trendLineData.length - 1]?.trendValue }
                    ]}
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Overall Trend</h3>
            <div>
              <p className={`text-lg font-bold ${
                trend === 'increasing' ? 'text-green-600' : 
                trend === 'decreasing' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {trend === 'increasing' ? 'Increasing' : 
                 trend === 'decreasing' ? 'Decreasing' : 'Stable'}
              </p>
              <p className="text-sm text-muted-foreground">
                {percentChange.toFixed(1)}% change over period
              </p>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Best Period</h3>
            <div>
              {(() => {
                // Find period with highest total
                const bestPeriod = [...chartData].sort((a, b) => b.totalAmount - a.totalAmount)[0];
                if (!bestPeriod) return null;
                
                return (
                  <>
                    <p className="text-lg font-bold">{bestPeriod.date}</p>
                    <p className="text-sm text-muted-foreground">
                      ${bestPeriod.totalAmount.toFixed(2)} from {bestPeriod.tipCount} tips
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Average Over Time</h3>
            <div>
              <p className="text-lg font-bold">
                ${(chartData.reduce((sum, d) => sum + d.avgAmount, 0) / chartData.length).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Avg tip amount over selected period
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}