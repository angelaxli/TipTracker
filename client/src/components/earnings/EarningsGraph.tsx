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
    default: // week
      startDate = startOfWeek(today);
      endDate = endOfWeek(today);
  }

  const prepareGraphData = () => {
    if (!tips) return [];

    const interval = {
      start: startDate,
      end: endDate
    };

    let dataPoints: Date[] = [];
    switch (groupBy) {
      case "week":
        dataPoints = eachWeekOfInterval(interval);
        break;
      case "month":
        dataPoints = eachMonthOfInterval(interval);
        break;
      default: // day
        dataPoints = eachDayOfInterval(interval);
    }

    return dataPoints.map(date => {
      const filteredTips = tips.filter(tip => {
        const tipDate = new Date(tip.date);
        if (groupBy === "day") {
          return tipDate.toDateString() === date.toDateString();
        } else if (groupBy === "week") {
          return getWeek(tipDate) === getWeek(date);
        } else { // month
          return getMonth(tipDate) === getMonth(date);
        }
      });

      const total = filteredTips.reduce((sum, tip) => sum + tip.amount, 0);

      return {
        date: format(date, groupBy === "day" ? "MMM d" : groupBy === "week" ? "'Week' w" : "MMM yyyy"),
        amount: parseFloat(total.toFixed(2))
      };
    });
  };

  const graphData = prepareGraphData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800">Earnings Graph</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0 gap-4">
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

        {isLoading ? (
          <Skeleton className="w-full h-[400px]" />
        ) : (
          <div className="w-full h-[400px]">
            <ResponsiveContainer>
              {graphType === "bar" ? (
                <BarChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" name="Earnings" fill="#4F46E5" />
                </BarChart>
              ) : (
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" name="Earnings" stroke="#4F46E5" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}