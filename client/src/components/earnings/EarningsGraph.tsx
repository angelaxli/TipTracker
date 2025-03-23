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
import { Tip, TipSource } from "@shared/schema";

export function EarningsGraph() {
  const [dateRange, setDateRange] = useState("week");
  const [graphType, setGraphType] = useState("bar");
  const [groupBy, setGroupBy] = useState("day");
  
  const { data: tips, isLoading } = useQuery<Tip[]>({
    queryKey: ['/api/tips'],
  });
  
  // Calculate date range
  const today = new Date();
  let startDate: Date, endDate: Date;

  switch (dateRange) {
    case "week":
      startDate = startOfWeek(today);
      endDate = endOfWeek(today);
      break;
    case "month":
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;
    case "year":
      startDate = startOfYear(today);
      endDate = endOfYear(today);
      break;
    default:
      startDate = subDays(today, 7);
      endDate = today;
  }

  // Process data based on the selected grouping
  const processData = () => {
    if (!tips) return [];
    
    const filteredTips = tips.filter(tip => {
      const tipDate = parseISO(tip.date.toString());
      return tipDate >= startDate && tipDate <= endDate;
    });
    
    if (groupBy === "source") {
      // Group by source
      const sourceGroups: Record<string, number> = {
        cash: 0,
        venmo: 0,
        credit_card: 0,
        other: 0,
      };
      
      filteredTips.forEach(tip => {
        sourceGroups[tip.source] = (sourceGroups[tip.source] || 0) + tip.amount;
      });
      
      return Object.entries(sourceGroups).map(([source, amount]) => ({
        name: source.charAt(0).toUpperCase() + source.slice(1).replace('_', ' '),
        amount: parseFloat(amount.toFixed(2)),
      }));
    } else {
      // Group by time period (day, week, month)
      let periods: Date[] = [];
      let formatStr = "";
      
      if (groupBy === "day") {
        periods = eachDayOfInterval({ start: startDate, end: endDate });
        formatStr = "MMM d";
      } else if (groupBy === "week") {
        // Get all Mondays in the range
        let current = startOfWeek(startDate);
        while (current <= endDate) {
          periods.push(current);
          current = addDays(current, 7);
        }
        formatStr = "'Week' w";
      } else if (groupBy === "month") {
        periods = eachMonthOfInterval({ start: startDate, end: endDate });
        formatStr = "MMM";
      }
      
      return periods.map(period => {
        let periodStart: Date, periodEnd: Date;
        
        if (groupBy === "day") {
          periodStart = period;
          periodEnd = period;
        } else if (groupBy === "week") {
          periodStart = period;
          periodEnd = addDays(period, 6);
        } else {
          periodStart = startOfMonth(period);
          periodEnd = endOfMonth(period);
        }
        
        const periodTotal = filteredTips
          .filter(tip => {
            const tipDate = parseISO(tip.date.toString());
            return tipDate >= periodStart && tipDate <= periodEnd;
          })
          .reduce((sum, tip) => sum + tip.amount, 0);
        
        return {
          name: format(period, formatStr),
          amount: parseFloat(periodTotal.toFixed(2)),
        };
      });
    }
  };
  
  const graphData = processData();
  
  // Calculate summary statistics
  const calculateStats = () => {
    if (!graphData.length) return { total: 0, average: 0, highest: 0 };
    
    const total = graphData.reduce((sum, item) => sum + item.amount, 0);
    const average = total / graphData.length;
    const highest = Math.max(...graphData.map(item => item.amount));
    
    return {
      total: parseFloat(total.toFixed(2)),
      average: parseFloat(average.toFixed(2)),
      highest: parseFloat(highest.toFixed(2)),
    };
  };
  
  const stats = calculateStats();
  
  // Export to CSV
  const exportCSV = () => {
    if (!tips) return;
    
    // Filter tips by selected date range
    const filteredTips = tips.filter(tip => {
      const tipDate = parseISO(tip.date.toString());
      return tipDate >= startDate && tipDate <= endDate;
    });
    
    // Format the data as CSV
    const headers = ["Date", "Amount", "Source", "Notes"];
    const rows = filteredTips.map(tip => [
      format(new Date(tip.date), "yyyy-MM-dd HH:mm:ss"),
      tip.amount.toFixed(2),
      tip.source,
      tip.notes || "",
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");
    
    // Create a download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tips_${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800">Earnings Graph</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0 gap-4">
          <div>
            <label htmlFor="graph-date-range" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="graph-type" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="group-by" className="block text-sm font-medium text-gray-700 mb-1">
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
                <SelectItem value="source">Source</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Graph */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : graphData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              {graphType === "bar" ? (
                <BarChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                  <Legend />
                  <Bar dataKey="amount" fill="#2E7D32" name="Amount" />
                </BarChart>
              ) : (
                <LineChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#2E7D32" name="Amount" />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No data available for the selected period</p>
            </div>
          )}
        </div>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total</h3>
            <p className="text-2xl font-medium text-gray-800">${stats.total}</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Average</h3>
            <p className="text-2xl font-medium text-gray-800">${stats.average}</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Highest</h3>
            <p className="text-2xl font-medium text-gray-800">${stats.highest}</p>
          </div>
        </div>
        
        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={exportCSV}
            disabled={isLoading || !tips?.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
