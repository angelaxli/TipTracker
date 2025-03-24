import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TipsByTimeAnalysis } from "@/components/analytics/TipsByTimeAnalysis";
import { TipsBySourceAnalysis } from "@/components/analytics/TipsBySourceAnalysis";
import { IncomeProjection } from "@/components/analytics/IncomeProjection";
import { HeatmapVisualization } from "@/components/analytics/HeatmapVisualization";
import { TipTrendsOverTime } from "@/components/analytics/TipTrendsOverTime";
import { ComparativeAnalysis } from "@/components/analytics/ComparativeAnalysis";
import { format } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { queryClient } from "@/lib/queryClient";
import { tipSources } from "@shared/schema";
import type { TipSource } from "@shared/schema";

// Helper function to convert tips data to CSV
const tipsToCSV = (tips: any[]) => {
  if (!tips || tips.length === 0) return '';
  
  const headers = Object.keys(tips[0]).join(',');
  const rows = tips.map(tip => 
    Object.values(tip).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(',')
  ).join('\n');
  
  return `${headers}\n${rows}`;
};

export default function AdvancedAnalytics() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("by-time");
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
    to: new Date()
  });

  // Fetch tip data
  const { data: tips, isLoading } = useQuery({
    queryKey: ['/api/tips'],
  });

  // Filter tips by date range
  const filteredTips = tips?.filter((tip: any) => {
    const tipDate = new Date(tip.date);
    return tipDate >= dateRange.from && tipDate <= dateRange.to;
  });

  // Calculate statistics
  const stats = {
    totalTips: filteredTips?.length || 0,
    totalAmount: filteredTips?.reduce((sum: number, tip: any) => sum + tip.amount, 0) || 0,
    averageAmount: filteredTips?.length 
      ? filteredTips.reduce((sum: number, tip: any) => sum + tip.amount, 0) / filteredTips.length 
      : 0,
    tipsBySource: tipSources.reduce((acc: Record<string, number>, source: TipSource) => {
      acc[source] = filteredTips?.filter((tip: any) => tip.source === source).length || 0;
      return acc;
    }, {} as Record<string, number>)
  };

  // Handle download of tip data
  const handleDownloadCSV = () => {
    if (!filteredTips || filteredTips.length === 0) {
      toast({
        title: "No data to download",
        description: "There are no tips in the selected date range.",
        variant: "destructive",
      });
      return;
    }

    const csv = tipsToCSV(filteredTips);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tip-data-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your tip data is being downloaded as a CSV file.",
    });
  };

  // Handle refresh data
  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/tips'] });
    toast({
      title: "Data refreshed",
      description: "The analytics data has been refreshed.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton title="Advanced Analytics" />
      
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Date Range Selector */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center mb-6">
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                      </>
                    ) : (
                      format(dateRange.from, "PPP")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{
                    from: dateRange?.from || new Date(),
                    to: dateRange?.to || new Date(),
                  }}
                  onSelect={(range) => 
                    setDateRange({ 
                      from: range?.from || new Date(), 
                      to: range?.to || new Date() 
                    })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefreshData}>
              Refresh Data
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Tips</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalTips}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Average Tip</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">${stats.averageAmount.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Most Common Source</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold capitalize">
                  {Object.entries(stats.tipsBySource).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs 
          defaultValue="by-time" 
          value={selectedTab} 
          onValueChange={setSelectedTab} 
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
            <TabsTrigger value="by-time">Time Analysis</TabsTrigger>
            <TabsTrigger value="by-source">Source Analysis</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap View</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="comparative">Comparative</TabsTrigger>
            <TabsTrigger value="projection">Projections</TabsTrigger>
          </TabsList>
          
          <TabsContent value="by-time" className="space-y-4">
            <TipsByTimeAnalysis tips={filteredTips} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="by-source" className="space-y-4">
            <TipsBySourceAnalysis tips={filteredTips} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="heatmap" className="space-y-4">
            <HeatmapVisualization tips={filteredTips} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <TipTrendsOverTime tips={filteredTips} isLoading={isLoading} dateRange={dateRange} />
          </TabsContent>
          
          <TabsContent value="comparative" className="space-y-4">
            <ComparativeAnalysis tips={filteredTips} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="projection" className="space-y-4">
            <IncomeProjection tips={filteredTips} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}