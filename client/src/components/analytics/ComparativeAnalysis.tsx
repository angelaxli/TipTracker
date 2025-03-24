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
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { format, parseISO, isMonday, isTuesday, isWednesday, isThursday, isFriday, isSaturday, isSunday, isWeekend } from "date-fns";

interface ComparativeAnalysisProps {
  tips: any[] | undefined;
  isLoading: boolean;
}

export function ComparativeAnalysis({ tips, isLoading }: ComparativeAnalysisProps) {
  const [comparisonType, setComparisonType] = useState<"weekday-weekend" | "time-of-day" | "radar">("weekday-weekend");
  
  // If loading or no tips
  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!tips || tips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparative Analysis</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">No tip data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Function to categorize time of day
  const getTimeOfDay = (hour: number) => {
    if (hour >= 5 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Night";
  };

  // Prepare weekday vs weekend data
  const weekdayWeekendData = [
    { name: "Weekday", count: 0, total: 0, average: 0 },
    { name: "Weekend", count: 0, total: 0, average: 0 }
  ];

  // Prepare time of day data
  const timeOfDayData = [
    { name: "Morning", count: 0, total: 0, average: 0 },
    { name: "Afternoon", count: 0, total: 0, average: 0 },
    { name: "Evening", count: 0, total: 0, average: 0 },
    { name: "Night", count: 0, total: 0, average: 0 }
  ];

  // Prepare day of week data for radar chart
  const dayOfWeekData = [
    { subject: "Monday", A: 0, fullMark: 150 },
    { subject: "Tuesday", A: 0, fullMark: 150 },
    { subject: "Wednesday", A: 0, fullMark: 150 },
    { subject: "Thursday", A: 0, fullMark: 150 },
    { subject: "Friday", A: 0, fullMark: 150 },
    { subject: "Saturday", A: 0, fullMark: 150 },
    { subject: "Sunday", A: 0, fullMark: 150 }
  ];

  // Process tips data
  tips.forEach(tip => {
    const date = parseISO(tip.date);
    const hour = date.getHours();
    const amount = parseFloat(tip.amount);
    const timeOfDay = getTimeOfDay(hour);
    
    // Update weekday/weekend stats
    const isWeekendDay = isWeekend(date);
    const category = isWeekendDay ? 1 : 0; // 0 for weekday, 1 for weekend
    
    weekdayWeekendData[category].count += 1;
    weekdayWeekendData[category].total += amount;
    
    // Update time of day stats
    const timeIndex = timeOfDayData.findIndex(t => t.name === timeOfDay);
    if (timeIndex >= 0) {
      timeOfDayData[timeIndex].count += 1;
      timeOfDayData[timeIndex].total += amount;
    }
    
    // Update day of week stats for radar chart
    let dayIndex = -1;
    if (isMonday(date)) dayIndex = 0;
    else if (isTuesday(date)) dayIndex = 1;
    else if (isWednesday(date)) dayIndex = 2;
    else if (isThursday(date)) dayIndex = 3;
    else if (isFriday(date)) dayIndex = 4;
    else if (isSaturday(date)) dayIndex = 5;
    else if (isSunday(date)) dayIndex = 6;
    
    if (dayIndex >= 0) {
      dayOfWeekData[dayIndex].A += amount;
    }
  });

  // Calculate averages
  weekdayWeekendData.forEach(category => {
    category.average = category.count > 0 ? category.total / category.count : 0;
  });

  timeOfDayData.forEach(timeSlot => {
    timeSlot.average = timeSlot.count > 0 ? timeSlot.total / timeSlot.count : 0;
  });

  // Generate colors for bar chart
  const getBarColor = (index: number) => {
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    return colors[index % colors.length];
  };

  // Get active dataset based on selected comparison type
  const getActiveDataset = () => {
    switch (comparisonType) {
      case 'weekday-weekend':
        return weekdayWeekendData;
      case 'time-of-day':
        return timeOfDayData;
      case 'radar':
        return dayOfWeekData;
      default:
        return weekdayWeekendData;
    }
  };

  const activeDataset = getActiveDataset();

  // Calculate percent difference between weekday and weekend
  const calculateWeekdayWeekendDifference = () => {
    const weekdayAvg = weekdayWeekendData[0].average;
    const weekendAvg = weekdayWeekendData[1].average;
    
    if (weekdayAvg === 0) return 0;
    return ((weekendAvg - weekdayAvg) / weekdayAvg) * 100;
  };

  const weekdayWeekendDiff = calculateWeekdayWeekendDifference();

  // Find best time of day
  const findBestTimeOfDay = () => {
    return [...timeOfDayData].sort((a, b) => b.average - a.average)[0];
  };

  const bestTimeOfDay = findBestTimeOfDay();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Comparative Analysis</CardTitle>
        <Tabs 
          value={comparisonType} 
          onValueChange={(v) => setComparisonType(v as "weekday-weekend" | "time-of-day" | "radar")}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="weekday-weekend" className="text-xs">Weekday/Weekend</TabsTrigger>
            <TabsTrigger value="time-of-day" className="text-xs">Time of Day</TabsTrigger>
            <TabsTrigger value="radar" className="text-xs">Day Radar</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {comparisonType === 'radar' ? (
              <RadarChart outerRadius={150} width={500} height={500} data={dayOfWeekData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                <Radar
                  name="Tip Amount"
                  dataKey="A"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total Tips']}
                />
                <Legend />
              </RadarChart>
            ) : (
              <BarChart
                data={activeDataset}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', dy: 50 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Count', angle: 90, position: 'insideRight', dy: 40 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'average') {
                      return [`$${value.toFixed(2)}`, 'Average Tip'];
                    } else if (name === 'total') {
                      return [`$${value.toFixed(2)}`, 'Total Amount'];
                    } else {
                      return [value, name];
                    }
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="average" 
                  name="Average Tip" 
                  radius={[4, 4, 0, 0]}
                >
                  {activeDataset.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                </Bar>
                <Bar 
                  yAxisId="left"
                  dataKey="total" 
                  name="Total Amount" 
                  radius={[4, 4, 0, 0]}
                >
                  {activeDataset.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index + activeDataset.length)} />
                  ))}
                </Bar>
                <Bar 
                  yAxisId="right"
                  dataKey="count" 
                  name="Tip Count" 
                  radius={[4, 4, 0, 0]}
                >
                  {activeDataset.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index + activeDataset.length * 2)} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Weekend vs. Weekday</h3>
            <div>
              <p className={`text-lg font-bold ${
                weekdayWeekendDiff > 0 ? 'text-green-600' : 
                weekdayWeekendDiff < 0 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {weekdayWeekendDiff > 0 
                  ? 'Weekends Better' 
                  : weekdayWeekendDiff < 0 
                    ? 'Weekdays Better' 
                    : 'Equal'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.abs(weekdayWeekendDiff).toFixed(1)}% {weekdayWeekendDiff >= 0 ? 'higher' : 'lower'} on {weekdayWeekendDiff >= 0 ? 'weekends' : 'weekdays'}
              </p>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Best Time of Day</h3>
            <div>
              <p className="text-lg font-bold">{bestTimeOfDay.name}</p>
              <p className="text-sm text-muted-foreground">
                ${bestTimeOfDay.average.toFixed(2)} average per tip
              </p>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Best Day of Week</h3>
            <div>
              {(() => {
                const bestDay = [...dayOfWeekData].sort((a, b) => b.A - a.A)[0];
                return (
                  <>
                    <p className="text-lg font-bold">{bestDay.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      ${bestDay.A.toFixed(2)} total earnings
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}