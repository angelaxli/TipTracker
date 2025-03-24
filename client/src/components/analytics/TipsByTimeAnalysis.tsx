import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { format, parseISO, startOfWeek, getDay, addDays } from "date-fns";

// Map numeric day to string name
const getDayName = (dayNum: number) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayNum];
};

// Get hour label for charts (12-hour format with AM/PM)
const getHourLabel = (hour: number) => {
  return hour === 0 ? "12 AM" : 
         hour < 12 ? `${hour} AM` : 
         hour === 12 ? "12 PM" : 
         `${hour - 12} PM`;
};

interface TipsByTimeAnalysisProps {
  tips: any[] | undefined;
  isLoading: boolean;
}

export function TipsByTimeAnalysis({ tips, isLoading }: TipsByTimeAnalysisProps) {
  const [timeView, setTimeView] = useState<"day" | "hour" | "month">("day");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // If loading or no tips
  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!tips || tips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tips by Time</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">No tip data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data by day of week
  const tipsByDay = Array(7).fill(0).map((_, idx) => ({
    day: getDayName(idx),
    count: 0,
    total: 0,
    average: 0
  }));

  // Prepare data by hour
  const tipsByHour = Array(24).fill(0).map((_, idx) => ({
    hour: getHourLabel(idx),
    count: 0,
    total: 0,
    average: 0,
    rawHour: idx // For sorting
  }));

  // Prepare data by month
  const tipsByMonth = Array(12).fill(0).map((_, idx) => ({
    month: format(new Date(2023, idx, 1), 'MMM'),
    count: 0,
    total: 0,
    average: 0,
    monthIndex: idx // For sorting
  }));

  // Process tips data
  tips.forEach(tip => {
    const date = parseISO(tip.date);
    const dayOfWeek = getDay(date);
    const hour = date.getHours();
    const month = date.getMonth();
    const amount = parseFloat(tip.amount);

    // Update day stats
    tipsByDay[dayOfWeek].count += 1;
    tipsByDay[dayOfWeek].total += amount;

    // Update hour stats
    tipsByHour[hour].count += 1;
    tipsByHour[hour].total += amount;

    // Update month stats
    tipsByMonth[month].count += 1;
    tipsByMonth[month].total += amount;
  });

  // Calculate averages
  tipsByDay.forEach(day => {
    day.average = day.count > 0 ? day.total / day.count : 0;
  });

  tipsByHour.forEach(hour => {
    hour.average = hour.count > 0 ? hour.total / hour.count : 0;
  });

  tipsByMonth.forEach(month => {
    month.average = month.count > 0 ? month.total / month.count : 0;
  });

  // Get the active data set based on the selected time view
  const getActiveDataset = () => {
    switch (timeView) {
      case 'day':
        return tipsByDay;
      case 'hour':
        return tipsByHour.sort((a, b) => a.rawHour - b.rawHour);
      case 'month':
        return tipsByMonth.sort((a, b) => a.monthIndex - b.monthIndex);
      default:
        return tipsByDay;
    }
  };

  const activeDataset = getActiveDataset();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Tips by Time</CardTitle>
        <div className="space-x-2">
          <Tabs 
            value={timeView} 
            onValueChange={(v) => setTimeView(v as "day" | "hour" | "month")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto"
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
              <TabsTrigger value="hour" className="text-xs">Hour</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs 
            value={chartType} 
            onValueChange={(v) => setChartType(v as "bar" | "line")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="bar" className="text-xs">Bar</TabsTrigger>
              <TabsTrigger value="line" className="text-xs">Line</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={activeDataset}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={timeView === 'day' ? "day" : (timeView === 'hour' ? "hour" : "month")} 
                  tick={{ fontSize: 12 }}
                  angle={timeView === 'hour' ? -45 : 0}
                  textAnchor={timeView === 'hour' ? "end" : "middle"}
                  height={timeView === 'hour' ? 70 : 30}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Tip Amount ($)', angle: -90, position: 'insideLeft', dy: 50 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Count', angle: 90, position: 'insideRight', dy: 40 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                <Bar 
                  yAxisId="left"
                  dataKey="average" 
                  fill="#8884d8" 
                  name="Avg Tip Amount"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="count" 
                  fill="#82ca9d" 
                  name="Number of Tips"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart
                data={activeDataset}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={timeView === 'day' ? "day" : (timeView === 'hour' ? "hour" : "month")} 
                  tick={{ fontSize: 12 }}
                  angle={timeView === 'hour' ? -45 : 0}
                  textAnchor={timeView === 'hour' ? "end" : "middle"}
                  height={timeView === 'hour' ? 70 : 30}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Tip Amount ($)', angle: -90, position: 'insideLeft', dy: 50 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Count', angle: 90, position: 'insideRight', dy: 40 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="average" 
                  stroke="#8884d8" 
                  name="Avg Tip Amount"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="count" 
                  stroke="#82ca9d" 
                  name="Number of Tips"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Best Day for Tips</h3>
            <div>
              <p className="text-lg font-bold">
                {tipsByDay.sort((a, b) => b.average - a.average)[0]?.day || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                Average: ${tipsByDay.sort((a, b) => b.average - a.average)[0]?.average.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Best Time for Tips</h3>
            <div>
              <p className="text-lg font-bold">
                {tipsByHour.sort((a, b) => b.average - a.average)[0]?.hour || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                Average: ${tipsByHour.sort((a, b) => b.average - a.average)[0]?.average.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Best Month for Tips</h3>
            <div>
              <p className="text-lg font-bold">
                {tipsByMonth.sort((a, b) => b.average - a.average)[0]?.month || 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">
                Average: ${tipsByMonth.sort((a, b) => b.average - a.average)[0]?.average.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}