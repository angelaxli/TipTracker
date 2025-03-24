import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format, parseISO, addMonths, addWeeks, eachMonthOfInterval } from "date-fns";
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
  ReferenceLine,
  ComposedChart,
  Bar
} from "recharts";

interface IncomeProjectionProps {
  tips: any[] | undefined;
  isLoading: boolean;
}

export function IncomeProjection({ tips, isLoading }: IncomeProjectionProps) {
  const [projectionType, setProjectionType] = useState<"monthly" | "weekly" | "annual">("monthly");
  const [growthRate, setGrowthRate] = useState<number>(0);
  const [forecastPeriods, setForecastPeriods] = useState<number>(6);
  
  // If loading or no tips
  if (isLoading) {
    return <Skeleton className="w-full h-[450px]" />;
  }

  if (!tips || tips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income Projection</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">No tip data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate historical periods
  const calculateHistoricalPeriods = () => {
    // Sort tips by date
    const sortedTips = [...tips].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (sortedTips.length === 0) return [];
    
    const startDate = parseISO(sortedTips[0].date);
    const endDate = parseISO(sortedTips[sortedTips.length - 1].date);
    
    if (projectionType === 'monthly') {
      // Generate all months in the date range
      const monthIntervals = eachMonthOfInterval({ start: startDate, end: endDate });
      
      // Calculate totals for each month
      return monthIntervals.map(month => {
        const monthTips = tips.filter(tip => {
          const tipDate = parseISO(tip.date);
          return tipDate.getMonth() === month.getMonth() && 
                 tipDate.getFullYear() === month.getFullYear();
        });
        
        const total = monthTips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0);
        
        return {
          label: format(month, 'MMM yyyy'),
          date: month,
          value: total,
          isHistory: true
        };
      });
    } else if (projectionType === 'weekly') {
      // Group tips by week
      const weekMap = new Map();
      
      sortedTips.forEach(tip => {
        const date = parseISO(tip.date);
        const weekKey = format(date, 'yyyy-ww'); // Year and week number
        const amount = parseFloat(tip.amount);
        
        if (weekMap.has(weekKey)) {
          const weekData = weekMap.get(weekKey);
          weekData.value += amount;
          weekData.count += 1;
          
          if (date > weekData.maxDate) {
            weekData.date = date;
            weekData.maxDate = date;
            weekData.label = `Week ${format(date, 'w')} - ${format(date, 'MMM yyyy')}`;
          }
        } else {
          weekMap.set(weekKey, {
            date,
            maxDate: date,
            label: `Week ${format(date, 'w')} - ${format(date, 'MMM yyyy')}`,
            value: amount,
            count: 1,
            isHistory: true
          });
        }
      });
      
      return Array.from(weekMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    } else {
      // Annual - Group tips by year
      const yearMap = new Map();
      
      sortedTips.forEach(tip => {
        const date = parseISO(tip.date);
        const yearKey = format(date, 'yyyy');
        const amount = parseFloat(tip.amount);
        
        if (yearMap.has(yearKey)) {
          const yearData = yearMap.get(yearKey);
          yearData.value += amount;
          yearData.count += 1;
        } else {
          yearMap.set(yearKey, {
            date: new Date(parseInt(yearKey), 0, 1),
            label: yearKey,
            value: amount,
            count: 1,
            isHistory: true
          });
        }
      });
      
      return Array.from(yearMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    }
  };

  const historicalData = calculateHistoricalPeriods();
  
  // Calculate projected periods
  const calculateProjectedPeriods = () => {
    if (historicalData.length === 0) return [];
    
    const lastHistoricalPeriod = historicalData[historicalData.length - 1];
    const lastValue = lastHistoricalPeriod.value;
    const projectedPeriods = [];
    
    for (let i = 1; i <= forecastPeriods; i++) {
      const growthFactor = 1 + (growthRate / 100);
      let projectedValue = lastValue * Math.pow(growthFactor, i);
      let projectedDate;
      let label;
      
      if (projectionType === 'monthly') {
        projectedDate = addMonths(lastHistoricalPeriod.date, i);
        label = format(projectedDate, 'MMM yyyy');
      } else if (projectionType === 'weekly') {
        projectedDate = addWeeks(lastHistoricalPeriod.date, i);
        label = `Week ${format(projectedDate, 'w')} - ${format(projectedDate, 'MMM yyyy')}`;
      } else {
        projectedDate = new Date(lastHistoricalPeriod.date.getFullYear() + i, 0, 1);
        label = format(projectedDate, 'yyyy');
      }
      
      projectedPeriods.push({
        date: projectedDate,
        label,
        value: projectedValue,
        isProjection: true
      });
    }
    
    return projectedPeriods;
  };

  const projectedData = calculateProjectedPeriods();
  
  // Combine historical and projected data
  const combinedData = [...historicalData, ...projectedData];
  
  // Calculate total projected income
  const totalProjectedIncome = projectedData.reduce((sum, period) => sum + period.value, 0);
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Income Projection</CardTitle>
        <Tabs 
          value={projectionType} 
          onValueChange={(v) => setProjectionType(v as "monthly" | "weekly" | "annual")}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
            <TabsTrigger value="annual" className="text-xs">Annual</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="growth-rate">Growth Rate (%)</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="growth-rate"
                type="number" 
                value={growthRate} 
                onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 0)}
                min="-20"
                max="20"
                step="0.5"
                className="w-full"
              />
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setGrowthRate(Math.max(-20, growthRate - 1))}
                >
                  -
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setGrowthRate(Math.min(20, growthRate + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Label htmlFor="periods">Forecast Periods</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="periods"
                type="number" 
                value={forecastPeriods} 
                onChange={(e) => setForecastPeriods(parseInt(e.target.value) || 1)}
                min="1"
                max="24"
                step="1"
                className="w-full"
              />
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setForecastPeriods(Math.max(1, forecastPeriods - 1))}
                >
                  -
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setForecastPeriods(Math.min(24, forecastPeriods + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={combinedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Income ($)', angle: -90, position: 'insideLeft', dy: 50 }}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                labelFormatter={(label) => `${label}`}
              />
              <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
              
              <ReferenceLine x={historicalData[historicalData.length - 1]?.label} 
                stroke="#ff7300" 
                label={{ value: 'Now', position: 'top', fill: '#ff7300' }} 
              />
              
              <Area 
                type="monotone" 
                dataKey="value" 
                data={historicalData}
                name="Historical" 
                fill="#8884d8"
                fillOpacity={0.3}
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              <Area
                type="monotone" 
                dataKey="value" 
                data={projectedData}
                name="Projected" 
                fill="#82ca9d"
                fillOpacity={0.3}
                stroke="#82ca9d"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Total Projected Income</h3>
            <div>
              <p className="text-lg font-bold text-green-600">
                ${totalProjectedIncome.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Over next {forecastPeriods} {projectionType === 'monthly' ? 'months' : projectionType === 'weekly' ? 'weeks' : 'years'}
              </p>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Average Projected {projectionType === 'monthly' ? 'Monthly' : projectionType === 'weekly' ? 'Weekly' : 'Annual'} Income</h3>
            <div>
              <p className="text-lg font-bold">
                ${(totalProjectedIncome / forecastPeriods).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Per {projectionType === 'monthly' ? 'month' : projectionType === 'weekly' ? 'week' : 'year'} with {growthRate}% growth
              </p>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Final Period Projection</h3>
            <div>
              <p className="text-lg font-bold">
                ${projectedData[projectedData.length - 1]?.value.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-muted-foreground">
                {projectedData[projectedData.length - 1]?.label || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}