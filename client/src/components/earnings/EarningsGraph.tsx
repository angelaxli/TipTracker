import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  getWeek,
  getMonth,
  subDays,
  isMonday,
} from "date-fns";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tip } from "@shared/schema";

export function EarningsGraph() {
  const [dateRange, setDateRange] = useState("week");
  const [graphType, setGraphType] = useState("bar");
  const [groupBy, setGroupBy] = useState("day");
  const [showBySource, setShowBySource] = useState(false);

  const { data: tips, isLoading } = useQuery<Tip[]>({
    queryKey: ['/api/tips'],
  });

  const today = new Date();
  let startDate: Date, endDate: Date;

  switch (dateRange) {
    case "month":
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;
    case "year":
      startDate = startOfYear(today);
      endDate = endOfYear(today);
      break;
    case "90days":
      startDate = subDays(today, 90);
      endDate = today;
      break;
    default: // week
      startDate = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
      endDate = endOfWeek(today, { weekStartsOn: 1 });
  }

  // Download earnings data as CSV
  const downloadCSV = () => {
    if (!tips) return;
    
    const filteredTips = tips.filter(tip => {
      const tipDate = new Date(tip.date);
      return tipDate >= startDate && tipDate <= endDate;
    });
    
    const headers = ['Date', 'Amount', 'Source', 'Notes'];
    const csvData = filteredTips.map(tip => {
      return [
        format(new Date(tip.date), 'yyyy-MM-dd'),
        tip.amount.toFixed(2),
        tip.source,
        tip.notes || ''
      ].join(',');
    });
    
    const csvContent = [
      headers.join(','),
      ...csvData
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `earnings-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  // Define types for our graph data
  type SimpleGraphData = {
    date: string;
    earnings: number;
  };

  type DetailedGraphData = {
    date: string;
    cash: number;
    venmo: number;
    credit_card: number;
    other: number;
    total: number;
  };

  type GraphData = SimpleGraphData | DetailedGraphData;

  const prepareGraphData = (): GraphData[] => {
    if (!tips) return [];

    const interval = {
      start: startDate,
      end: endDate
    };

    let dataPoints: Date[] = [];
    switch (groupBy) {
      case "week":
        dataPoints = eachWeekOfInterval(interval, { weekStartsOn: 1 });
        break;
      case "month":
        dataPoints = eachMonthOfInterval(interval);
        break;
      default: // day
        dataPoints = eachDayOfInterval(interval);
    }

    if (!showBySource) {
      // Simple aggregation by date
      return dataPoints.map(date => {
        const filteredTips = tips.filter(tip => {
          const tipDate = new Date(tip.date);
          if (groupBy === "day") {
            return tipDate.toDateString() === date.toDateString();
          } else if (groupBy === "week") {
            return getWeek(tipDate, { weekStartsOn: 1 }) === getWeek(date, { weekStartsOn: 1 });
          } else { // month
            return getMonth(tipDate) === getMonth(date);
          }
        });

        const total = filteredTips.reduce((sum, tip) => sum + tip.amount, 0);

        return {
          date: format(date, groupBy === "day" ? "MMM d" : groupBy === "week" ? "'Week' w" : "MMM yyyy"),
          earnings: parseFloat(total.toFixed(2))
        };
      });
    } else {
      // Aggregation by date AND source
      return dataPoints.map(date => {
        const filteredTips = tips.filter(tip => {
          const tipDate = new Date(tip.date);
          if (groupBy === "day") {
            return tipDate.toDateString() === date.toDateString();
          } else if (groupBy === "week") {
            return getWeek(tipDate, { weekStartsOn: 1 }) === getWeek(date, { weekStartsOn: 1 });
          } else { // month
            return getMonth(tipDate) === getMonth(date);
          }
        });

        // Get total for each source type
        const cashTotal = filteredTips
          .filter(tip => tip.source === 'cash')
          .reduce((sum, tip) => sum + tip.amount, 0);
          
        const venmoTotal = filteredTips
          .filter(tip => tip.source === 'venmo')
          .reduce((sum, tip) => sum + tip.amount, 0);
          
        const creditCardTotal = filteredTips
          .filter(tip => tip.source === 'credit_card')
          .reduce((sum, tip) => sum + tip.amount, 0);
          
        const otherTotal = filteredTips
          .filter(tip => tip.source === 'other')
          .reduce((sum, tip) => sum + tip.amount, 0);

        return {
          date: format(date, groupBy === "day" ? "MMM d" : groupBy === "week" ? "'Week' w" : "MMM yyyy"),
          cash: parseFloat(cashTotal.toFixed(2)),
          venmo: parseFloat(venmoTotal.toFixed(2)),
          credit_card: parseFloat(creditCardTotal.toFixed(2)),
          other: parseFloat(otherTotal.toFixed(2)),
          total: parseFloat((cashTotal + venmoTotal + creditCardTotal + otherTotal).toFixed(2))
        };
      });
    }
  };

  const graphData = prepareGraphData();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-gray-800">Earnings Graph</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadCSV}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-start justify-between mb-6 gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Graph Type
              </label>
              <Select value={graphType} onValueChange={setGraphType}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group By
              </label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Break down by source:
            </label>
            <input 
              type="checkbox" 
              checked={showBySource} 
              onChange={() => setShowBySource(!showBySource)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="w-full h-[400px]" />
        ) : graphData.length === 0 ? (
          <div className="w-full h-[400px] flex items-center justify-center border rounded-md">
            <p className="text-gray-500">No data available for the selected time period</p>
          </div>
        ) : (
          <div className="w-full h-[400px]">
            <ResponsiveContainer>
              {graphType === "bar" ? (
                <BarChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  {!showBySource ? (
                    <Bar dataKey="earnings" name="Earnings" fill="#4F46E5" />
                  ) : (
                    <>
                      <Bar dataKey="cash" name="Cash" fill="#22c55e" stackId="a" />
                      <Bar dataKey="venmo" name="Venmo" fill="#3b82f6" stackId="a" />
                      <Bar dataKey="credit_card" name="Credit Card" fill="#a855f7" stackId="a" />
                      <Bar dataKey="other" name="Other" fill="#94a3b8" stackId="a" />
                    </>
                  )}
                </BarChart>
              ) : (
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  {!showBySource ? (
                    <Line type="monotone" dataKey="earnings" name="Earnings" stroke="#4F46E5" />
                  ) : (
                    <>
                      <Line type="monotone" dataKey="cash" name="Cash" stroke="#22c55e" />
                      <Line type="monotone" dataKey="venmo" name="Venmo" stroke="#3b82f6" />
                      <Line type="monotone" dataKey="credit_card" name="Credit Card" stroke="#a855f7" />
                      <Line type="monotone" dataKey="other" name="Other" stroke="#94a3b8" />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#4F46E5" strokeWidth={2} />
                    </>
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Summary statistics */}
        {!isLoading && graphData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold mt-1">
                  ${graphData.reduce((sum, item) => {
                    if (showBySource && 'total' in item) {
                      return sum + item.total;
                    } else if (!showBySource && 'earnings' in item) {
                      return sum + item.earnings;
                    }
                    return sum;
                  }, 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-500">Average</p>
                <p className="text-2xl font-bold mt-1">
                  ${(graphData.reduce((sum, item) => 
                    sum + (showBySource ? item.total : item.earnings), 0) / 
                    graphData.filter(item => (showBySource ? item.total : item.earnings) > 0).length || 1).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-500">Highest</p>
                <p className="text-2xl font-bold mt-1">
                  ${Math.max(...graphData.map(item => 
                    showBySource ? item.total : item.earnings)).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-500">Days with Earnings</p>
                <p className="text-2xl font-bold mt-1">
                  {graphData.filter(item => 
                    (showBySource ? item.total : item.earnings) > 0).length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}