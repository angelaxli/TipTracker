import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tipSources } from "@shared/schema";
import type { TipSource } from "@shared/schema";

// Chart colors for different sources
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Get proper display name for tip source
const getSourceDisplayName = (source: string) => {
  switch(source) {
    case 'credit_card': return 'Credit Card';
    default: return source.charAt(0).toUpperCase() + source.slice(1);
  }
};

interface TipsBySourceAnalysisProps {
  tips: any[] | undefined;
  isLoading: boolean;
}

export function TipsBySourceAnalysis({ tips, isLoading }: TipsBySourceAnalysisProps) {
  const [analysisType, setAnalysisType] = useState<"count" | "amount">("count");
  const [chartView, setChartView] = useState<"pie" | "bar">("pie");
  
  // If loading or no tips
  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!tips || tips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tips by Source</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">No tip data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for visualization
  const sourceStats = tipSources.map(source => {
    const sourceTips = tips.filter(tip => tip.source === source);
    const count = sourceTips.length;
    const totalAmount = sourceTips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0);
    const averageAmount = count > 0 ? totalAmount / count : 0;
    
    // Format source name by replacing underscores with spaces and capitalizing each word
    const formatSourceName = (source: string) => {
      return source.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return {
      name: formatSourceName(source),
      source,
      count,
      total: totalAmount,
      average: averageAmount,
      percentage: tips.length > 0 ? (count / tips.length) * 100 : 0
    };
  });

  // Sort data by selected analysis type
  const sortedData = [...sourceStats].sort((a, b) => 
    analysisType === "count" ? b.count - a.count : b.total - a.total
  );

  // Format data for the chart
  const chartData = sortedData.map(item => ({
    name: item.name,
    value: analysisType === "count" ? item.count : item.total
  }));

  // Calculate total
  const total = analysisType === "count" 
    ? tips.length 
    : tips.reduce((sum, tip) => sum + parseFloat(tip.amount), 0);

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string) => {
    if (analysisType === "count") {
      const percentage = ((value / total) * 100).toFixed(1);
      return [`${value} tips (${percentage}%)`, name];
    } else {
      const percentage = ((value / total) * 100).toFixed(1);
      return [`$${value.toFixed(2)} (${percentage}%)`, name];
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Tips by Source</CardTitle>
        <div className="space-x-2">
          <Tabs 
            value={analysisType} 
            onValueChange={(v) => setAnalysisType(v as "count" | "amount")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="count" className="text-xs">Count</TabsTrigger>
              <TabsTrigger value="amount" className="text-xs">Amount</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs 
            value={chartView} 
            onValueChange={(v) => setChartView(v as "pie" | "bar")}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="pie" className="text-xs">Pie</TabsTrigger>
              <TabsTrigger value="bar" className="text-xs">Bar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "pie" ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            ) : (
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={80}
                />
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8" 
                  name={analysisType === "count" ? "Number of Tips" : "Total Amount"} 
                  radius={[0, 4, 4, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Most Common Source</h3>
            {sortedData.length > 0 && (
              <div>
                <p className="text-lg font-bold">{sortedData[0].name}</p>
                <p className="text-sm text-muted-foreground">
                  {sortedData[0].count} tips ({sortedData[0].percentage.toFixed(1)}%)
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2">Highest Average</h3>
            {sortedData.length > 0 && (
              <div>
                <p className="text-lg font-bold">
                  {sortedData.sort((a, b) => b.average - a.average)[0].name}
                </p>
                <p className="text-sm text-muted-foreground">
                  ${sortedData.sort((a, b) => b.average - a.average)[0].average.toFixed(2)} average per tip
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium mb-3">Source Breakdown</h3>
          <div className="space-y-2">
            {sortedData.map((source, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 mr-2 rounded-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                  <span>{source.name}</span>
                </div>
                <div className="flex space-x-6">
                  <span>{source.count} tips</span>
                  <span>${source.total.toFixed(2)}</span>
                  <span>${source.average.toFixed(2)} avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}