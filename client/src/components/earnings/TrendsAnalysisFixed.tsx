import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tip, TipSource } from "@shared/schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  getDay,
  getMonth,
  getHours,
  isWithinInterval,
  subDays,
  addDays,
} from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SOURCE_COLORS = {
  cash: "#22c55e",
  venmo: "#3b82f6",
  credit_card: "#a855f7",
  other: "#94a3b8"
};

export function TrendsAnalysis() {
  const [timeRange, setTimeRange] = useState("all");
  const [analysisTab, setAnalysisTab] = useState("days");

  const { data: tips, isLoading } = useQuery<Tip[]>({
    queryKey: ["/api/tips"],
  });

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const today = new Date();
    let start: Date, end: Date;
    
    switch (timeRange) {
      case "month":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "year":
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      case "90days":
        start = subDays(today, 90);
        end = today;
        break;
      case "week":
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      default: // all time
        if (!tips || tips.length === 0) {
          start = subDays(today, 30);
          end = today;
        } else {
          // Find earliest and latest dates in tips data
          const dates = tips.map(tip => new Date(tip.date));
          start = new Date(Math.min(...dates.map(d => d.getTime())));
          end = new Date(Math.max(...dates.map(d => d.getTime())));
        }
    }
    
    return { start, end };
  }, [timeRange, tips]);

  // Filter tips based on selected time range
  const filteredTips = useMemo(() => {
    if (!tips) return [];
    
    return tips.filter(tip => {
      const tipDate = new Date(tip.date);
      return isWithinInterval(tipDate, { 
        start: dateRange.start,
        end: addDays(dateRange.end, 1) // Include the end date
      });
    });
  }, [tips, dateRange]);

  // Analyze tips by day of week
  const tipsByDayOfWeek = useMemo(() => {
    const dayData = DAYS.map(day => ({
      name: day,
      count: 0,
      totalAmount: 0,
      averageAmount: 0,
    }));

    if (!filteredTips.length) return dayData;
    
    filteredTips.forEach(tip => {
      const tipDate = new Date(tip.date);
      const dayIndex = getDay(tipDate);
      dayData[dayIndex].count += 1;
      dayData[dayIndex].totalAmount += tip.amount;
    });
    
    // Calculate averages
    dayData.forEach(day => {
      day.averageAmount = day.count > 0 ? day.totalAmount / day.count : 0;
    });
    
    return dayData;
  }, [filteredTips]);

  // Analyze tips by month
  const tipsByMonth = useMemo(() => {
    const monthData = MONTHS.map(month => ({
      name: month,
      count: 0,
      totalAmount: 0,
      averageAmount: 0,
    }));

    if (!filteredTips.length) return monthData;
    
    filteredTips.forEach(tip => {
      const tipDate = new Date(tip.date);
      const monthIndex = getMonth(tipDate);
      monthData[monthIndex].count += 1;
      monthData[monthIndex].totalAmount += tip.amount;
    });
    
    // Calculate averages
    monthData.forEach(month => {
      month.averageAmount = month.count > 0 ? month.totalAmount / month.count : 0;
    });
    
    return monthData;
  }, [filteredTips]);

  // Analyze tips by hour of day
  const tipsByHour = useMemo(() => {
    const hourData = HOURS.map(hour => ({
      name: hour < 12 
        ? (hour === 0 ? '12am' : `${hour}am`) 
        : (hour === 12 ? '12pm' : `${hour - 12}pm`),
      hour: hour,
      count: 0,
      totalAmount: 0,
      averageAmount: 0,
    }));

    if (!filteredTips.length) return hourData;
    
    filteredTips.forEach(tip => {
      const tipDate = new Date(tip.date);
      const hourIndex = getHours(tipDate);
      hourData[hourIndex].count += 1;
      hourData[hourIndex].totalAmount += tip.amount;
    });
    
    // Calculate averages
    hourData.forEach(hour => {
      hour.averageAmount = hour.count > 0 ? hour.totalAmount / hour.count : 0;
    });
    
    return hourData;
  }, [filteredTips]);

  // Analyze tips by source
  const tipsBySource = useMemo(() => {
    const sourceData: Record<TipSource, { 
      name: string, 
      count: number, 
      totalAmount: number, 
      averageAmount: number 
    }> = {
      cash: { name: 'Cash', count: 0, totalAmount: 0, averageAmount: 0 },
      venmo: { name: 'Venmo', count: 0, totalAmount: 0, averageAmount: 0 },
      credit_card: { name: 'Credit Card', count: 0, totalAmount: 0, averageAmount: 0 },
      other: { name: 'Other', count: 0, totalAmount: 0, averageAmount: 0 }
    };

    if (!filteredTips.length) return Object.values(sourceData);
    
    filteredTips.forEach(tip => {
      sourceData[tip.source as TipSource].count += 1;
      sourceData[tip.source as TipSource].totalAmount += tip.amount;
    });
    
    // Calculate averages
    Object.keys(sourceData).forEach(source => {
      const key = source as TipSource;
      sourceData[key].averageAmount = sourceData[key].count > 0 
        ? sourceData[key].totalAmount / sourceData[key].count 
        : 0;
    });
    
    return Object.values(sourceData);
  }, [filteredTips]);

  // Calculate key insights
  const insights = useMemo(() => {
    if (!filteredTips.length) return null;
    
    // Best day by average
    const bestDayByAvg = [...tipsByDayOfWeek]
      .sort((a, b) => b.averageAmount - a.averageAmount)[0];
    
    // Best day by total
    const bestDayByTotal = [...tipsByDayOfWeek]
      .sort((a, b) => b.totalAmount - a.totalAmount)[0];
    
    // Best hour by average
    const bestHourByAvg = [...tipsByHour]
      .sort((a, b) => b.averageAmount - a.averageAmount)[0];
    
    // Best hour by total
    const bestHourByTotal = [...tipsByHour]
      .sort((a, b) => b.totalAmount - a.totalAmount)[0];
    
    // Most common source
    const mostCommonSource = [...tipsBySource]
      .sort((a, b) => b.count - a.count)[0];
    
    // Highest paying source
    const highestPayingSource = [...tipsBySource]
      .sort((a, b) => b.averageAmount - a.averageAmount)[0];

    // Calculate trends
    const totalEarnings = filteredTips.reduce((sum, tip) => sum + tip.amount, 0);
    const averageTipAmount = totalEarnings / filteredTips.length;
    
    return {
      bestDayByAvg,
      bestDayByTotal,
      bestHourByAvg,
      bestHourByTotal,
      mostCommonSource,
      highestPayingSource,
      totalEarnings,
      averageTipAmount,
      tipCount: filteredTips.length
    };
  }, [filteredTips, tipsByDayOfWeek, tipsByHour, tipsBySource]);

  if (isLoading) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-medium text-gray-800">Tip Trends Analysis</CardTitle>
              <CardDescription>
                Discover patterns in your tipping data to maximize your earnings
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Time Period:</span>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="border rounded p-1 text-sm"
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredTips.length ? (
            <div className="text-center py-8 border rounded-md">
              <p className="text-gray-500">No data available for the selected time period</p>
            </div>
          ) : (
            <>
              {/* Key Insights */}
              {insights && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-500">Best Day</p>
                      <p className="text-2xl font-bold mt-1">{insights.bestDayByAvg.name}</p>
                      <p className="text-xs text-gray-500">Avg: ${insights.bestDayByAvg.averageAmount.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-500">Best Hours</p>
                      <p className="text-2xl font-bold mt-1">{insights.bestHourByAvg.name}</p>
                      <p className="text-xs text-gray-500">Avg: ${insights.bestHourByAvg.averageAmount.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-500">Best Source</p>
                      <p className="text-2xl font-bold mt-1">{insights.highestPayingSource.name}</p>
                      <p className="text-xs text-gray-500">Avg: ${insights.highestPayingSource.averageAmount.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-500">Average Tip</p>
                      <p className="text-2xl font-bold mt-1">${insights.averageTipAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">From {insights.tipCount} tips</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detailed Analysis Tabs */}
              <Tabs defaultValue="days" onValueChange={setAnalysisTab} className="w-full">
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="days">Days of Week</TabsTrigger>
                  <TabsTrigger value="hours">Hours of Day</TabsTrigger>
                  <TabsTrigger value="sources">Payment Sources</TabsTrigger>
                  <TabsTrigger value="months">Monthly</TabsTrigger>
                </TabsList>
                
                {/* Days of the Week Analysis */}
                <TabsContent value="days" className="mt-0">
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer>
                      <BarChart data={tipsByDayOfWeek} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip 
                          formatter={(value: any, name) => {
                            if (typeof value === 'number') {
                              return [`$${value.toFixed(2)}`, name];
                            }
                            return [value, name];
                          }} 
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalAmount" name="Total Tips" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="averageAmount" name="Average Tip" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tipsByDayOfWeek.map((day) => (
                          <tr key={day.name}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${day.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${day.averageAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                {/* Hours Analysis */}
                <TabsContent value="hours" className="mt-0">
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer>
                      <LineChart data={tipsByHour} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip 
                          formatter={(value: any, name) => {
                            if (name === "Count") return [value, name];
                            return [`$${typeof value === 'number' ? value.toFixed(2) : value}`, name];
                          }} 
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="count" name="Count" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="averageAmount" name="Average Tip" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Top Hours by Average Tip Amount:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...tipsByHour]
                        .filter(hour => hour.count > 0)
                        .sort((a, b) => b.averageAmount - a.averageAmount)
                        .slice(0, 3)
                        .map((hour, index) => (
                          <Card key={hour.name}>
                            <CardContent className="p-4 flex justify-between items-center">
                              <div>
                                <p className="text-xl font-semibold">{hour.name}</p>
                                <p className="text-sm text-gray-500">${hour.averageAmount.toFixed(2)} avg</p>
                              </div>
                              <div className="text-3xl font-bold text-gray-300">#{index + 1}</div>
                            </CardContent>
                          </Card>
                        ))
                      }
                    </div>
                  </div>
                </TabsContent>
                
                {/* Payment Sources Analysis */}
                <TabsContent value="sources" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-[400px]">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={tipsBySource}
                            dataKey="totalAmount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={130}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {tipsBySource.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={SOURCE_COLORS[Object.keys(SOURCE_COLORS)[index % Object.keys(SOURCE_COLORS).length] as TipSource]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`$${typeof value === 'number' ? value.toFixed(2) : value}`, 'Amount']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="h-[400px]">
                      <ResponsiveContainer>
                        <BarChart 
                          data={tipsBySource} 
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip formatter={(value: any) => [`$${typeof value === 'number' ? value.toFixed(2) : value}`, 'Average']} />
                          <Legend />
                          <Bar dataKey="averageAmount" name="Average Tip" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Source</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tipsBySource.map((source) => (
                          <tr key={source.name}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{source.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{source.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${source.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${source.averageAmount.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(source.totalAmount / insights!.totalEarnings * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                {/* Monthly Analysis */}
                <TabsContent value="months" className="mt-0">
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer>
                      <BarChart data={tipsByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip 
                          formatter={(value: any, name) => {
                            if (typeof value === 'number') {
                              return [`$${value.toFixed(2)}`, name];
                            }
                            return [value, name];
                          }} 
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalAmount" name="Total Tips" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="averageAmount" name="Average Tip" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Top Months by Total Earnings:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...tipsByMonth]
                        .filter(month => month.count > 0)
                        .sort((a, b) => b.totalAmount - a.totalAmount)
                        .slice(0, 3)
                        .map((month, index) => (
                          <Card key={month.name}>
                            <CardContent className="p-4 flex justify-between items-center">
                              <div>
                                <p className="text-xl font-semibold">{month.name}</p>
                                <p className="text-sm text-gray-500">${month.totalAmount.toFixed(2)} total</p>
                              </div>
                              <div className="text-3xl font-bold text-gray-300">#{index + 1}</div>
                            </CardContent>
                          </Card>
                        ))
                      }
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}