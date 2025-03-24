import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseISO, format, getDay, getHours } from "date-fns";

// Type for heatmap cell data
interface HeatmapCell {
  dayIndex: number;
  hourIndex: number;
  count: number;
  total: number;
  average: number;
}

interface HeatmapVisualizationProps {
  tips: any[] | undefined;
  isLoading: boolean;
}

export function HeatmapVisualization({ tips, isLoading }: HeatmapVisualizationProps) {
  const [dataType, setDataType] = useState<"count" | "average" | "total">("count");
  
  // Day and hour labels
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hourLabels = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? "AM" : "PM";
    return `${hour}${ampm}`;
  });

  // If loading or no tips
  if (isLoading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  if (!tips || tips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tip Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[400px]">
          <p className="text-muted-foreground">No tip data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Initialize heatmap data
  let heatmapData: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      heatmapData.push({
        dayIndex: day,
        hourIndex: hour,
        count: 0,
        total: 0,
        average: 0,
      });
    }
  }

  // Process tips data
  tips.forEach(tip => {
    const date = parseISO(tip.date);
    const dayOfWeek = getDay(date);
    const hourOfDay = getHours(date);
    const amount = parseFloat(tip.amount);

    // Find the cell for this day and hour
    const cellIndex = (dayOfWeek * 24) + hourOfDay;
    if (cellIndex >= 0 && cellIndex < heatmapData.length) {
      heatmapData[cellIndex].count += 1;
      heatmapData[cellIndex].total += amount;
    }
  });

  // Calculate average for each cell
  heatmapData.forEach(cell => {
    cell.average = cell.count > 0 ? cell.total / cell.count : 0;
  });

  // Find max value for color scaling
  const maxValue = Math.max(
    ...heatmapData.map(cell => 
      dataType === 'count' 
        ? cell.count 
        : dataType === 'average' 
          ? cell.average 
          : cell.total
    )
  );

  // Generate color for heatmap cell
  const getCellColor = (value: number) => {
    // Using a blue scale - lighter blue for higher values
    const intensity = maxValue > 0 ? (value / maxValue) : 0;
    
    // Convert intensity to hex for blue gradient (from light to deep blue)
    const blue = Math.floor(255 - (intensity * 200));
    const green = Math.floor(255 - (intensity * 100));
    const red = Math.floor(255 - (intensity * 150));
    
    return `rgb(${red}, ${green}, ${blue})`;
  };

  // Get value for the current data type
  const getCellValue = (cell: HeatmapCell) => {
    switch(dataType) {
      case 'count': return cell.count;
      case 'average': return cell.average;
      case 'total': return cell.total;
      default: return cell.count;
    }
  };

  // Format the tooltip value
  const formatTooltipValue = (value: number) => {
    if (dataType === 'count') {
      return value === 1 ? `${value} tip` : `${value} tips`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Tip Activity Heatmap</CardTitle>
        <Tabs 
          value={dataType} 
          onValueChange={(v) => setDataType(v as "count" | "average" | "total")}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="count" className="text-xs">Count</TabsTrigger>
            <TabsTrigger value="average" className="text-xs">Average</TabsTrigger>
            <TabsTrigger value="total" className="text-xs">Total</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="overflow-x-auto">
          <div className="text-center text-sm font-medium mb-4">
            {dataType === 'count' && "Number of Tips by Day and Hour"}
            {dataType === 'average' && "Average Tip Amount by Day and Hour"}
            {dataType === 'total' && "Total Tip Amount by Day and Hour"}
          </div>
          
          <div className="flex">
            {/* Hour Labels */}
            <div className="w-12"></div>
            <div className="flex flex-1">
              {hourLabels.map((hour, i) => (
                <div 
                  key={i} 
                  className="flex-1 text-center text-xs font-medium text-gray-500"
                  style={{ minWidth: '30px' }}
                >
                  {i % 3 === 0 ? hour : ''}
                </div>
              ))}
            </div>
          </div>
          
          {/* Heatmap Grid */}
          <div className="mt-1">
            {dayLabels.map((day, dayIndex) => (
              <div key={dayIndex} className="flex items-center mb-1">
                <div className="w-12 text-xs font-medium text-gray-500">{day}</div>
                <div className="flex flex-1">
                  {hourLabels.map((_, hourIndex) => {
                    const cellIndex = (dayIndex * 24) + hourIndex;
                    const cell = heatmapData[cellIndex];
                    const value = getCellValue(cell);
                    
                    return (
                      <div 
                        key={hourIndex}
                        className="flex-1 h-8 border border-gray-100"
                        style={{ 
                          backgroundColor: getCellColor(value),
                          minWidth: '30px',
                          position: 'relative'
                        }}
                        title={`${day} ${hourLabels[hourIndex]}: ${formatTooltipValue(value)}`}
                      >
                        {value > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                            {value > 0 && dataType === 'count' ? value : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center">
              <div className="text-xs text-gray-500 mr-2">Low</div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-8 h-4"
                    style={{ 
                      backgroundColor: getCellColor(maxValue * (i + 1) / 5),
                    }}
                  ></div>
                ))}
              </div>
              <div className="text-xs text-gray-500 ml-2">High</div>
            </div>
          </div>
          
          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-muted rounded-lg p-3">
              <h3 className="text-sm font-medium mb-1">Peak Day & Time</h3>
              {heatmapData.length > 0 && (
                <div>
                  {(() => {
                    // Find peak cell based on current data type
                    const peakCell = [...heatmapData].sort((a, b) => 
                      getCellValue(b) - getCellValue(a)
                    )[0];
                    
                    const peakDay = dayLabels[peakCell.dayIndex];
                    const peakHour = hourLabels[peakCell.hourIndex];
                    const peakValue = getCellValue(peakCell);
                    
                    return (
                      <>
                        <p className="text-lg font-bold">{peakDay} at {peakHour}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTooltipValue(peakValue)}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div className="bg-muted rounded-lg p-3">
              <h3 className="text-sm font-medium mb-1">Busiest Day</h3>
              {dayLabels.length > 0 && (
                <div>
                  {(() => {
                    // Calculate total by day
                    const dayTotals = dayLabels.map((_, dayIndex) => {
                      const dayData = heatmapData.filter(cell => cell.dayIndex === dayIndex);
                      return {
                        day: dayLabels[dayIndex],
                        value: dayData.reduce((sum, cell) => sum + getCellValue(cell), 0)
                      };
                    });
                    
                    const busiestDay = [...dayTotals].sort((a, b) => b.value - a.value)[0];
                    
                    return (
                      <>
                        <p className="text-lg font-bold">{busiestDay.day}</p>
                        <p className="text-sm text-muted-foreground">
                          {dataType === 'count' 
                            ? `${busiestDay.value} tips total` 
                            : `$${busiestDay.value.toFixed(2)} total`}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div className="bg-muted rounded-lg p-3">
              <h3 className="text-sm font-medium mb-1">Busiest Hour</h3>
              {hourLabels.length > 0 && (
                <div>
                  {(() => {
                    // Calculate total by hour
                    const hourTotals = hourLabels.map((_, hourIndex) => {
                      const hourData = heatmapData.filter(cell => cell.hourIndex === hourIndex);
                      return {
                        hour: hourLabels[hourIndex],
                        value: hourData.reduce((sum, cell) => sum + getCellValue(cell), 0)
                      };
                    });
                    
                    const busiestHour = [...hourTotals].sort((a, b) => b.value - a.value)[0];
                    
                    return (
                      <>
                        <p className="text-lg font-bold">{busiestHour.hour}</p>
                        <p className="text-sm text-muted-foreground">
                          {dataType === 'count' 
                            ? `${busiestHour.value} tips total` 
                            : `$${busiestHour.value.toFixed(2)} total`}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}