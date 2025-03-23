import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Search, ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tip, TipSource } from "@shared/schema";

export function EarningsTable() {
  const [dateRange, setDateRange] = useState("week");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [tipToDelete, setTipToDelete] = useState<number | null>(null);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Calculate date range for query
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
    case "custom":
      // Default to last 90 days if custom is selected but no dates are provided
      startDate = subDays(today, 90);
      endDate = today;
      break;
    default:
      startDate = subDays(today, 7);
      endDate = today;
  }

  // Format dates for API request
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  const { data: tips, isLoading } = useQuery<Tip[]>({
    queryKey: ['/api/tips'],
  });

  // Filter tips by date range and search term
  const filteredTips = tips
    ? tips.filter(tip => {
        const tipDate = parseISO(tip.date.toString());
        const matchesDateRange = tipDate >= startDate && tipDate <= endDate;
        const matchesSearch = searchTerm
          ? tip.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tip.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tip.amount.toString().includes(searchTerm)
          : true;
        return matchesDateRange && matchesSearch;
      })
    : [];

  // Sort filtered tips
  const sortedTips = [...filteredTips].sort((a, b) => {
    if (sortField === "date") {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    } else {
      return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount;
    }
  });

  // Paginate results
  const totalPages = Math.ceil(sortedTips.length / itemsPerPage);
  const paginatedTips = sortedTips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle sort direction and field
  const toggleSort = (field: "date" | "amount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Delete tip
  const handleDeleteTip = async () => {
    if (tipToDelete === null) return;

    try {
      await apiRequest("DELETE", `/api/tips/${tipToDelete}`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/tips'] });
      toast({
        title: "Success",
        description: "Tip has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTipToDelete(null);
    }
  };

  const getSourceBadgeColor = (source: TipSource) => {
    switch (source) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "venmo":
        return "bg-blue-100 text-blue-800";
      case "credit_card":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <Select
                value={dateRange}
                onValueChange={(value) => {
                  setDateRange(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="w-full sm:w-auto">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                placeholder="Search earnings..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Earnings Table */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("date")}>
                    <div className="flex items-center">
                      Date
                      {sortField === "date" && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("amount")}>
                    <div className="flex items-center">
                      Amount
                      {sortField === "amount" && (
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No tips found for the selected date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTips.map((tip) => (
                    <TableRow key={tip.id}>
                      <TableCell className="font-medium">
                        {format(new Date(tip.date), "MMM d, yyyy - h:mm a")}
                      </TableCell>
                      <TableCell>${tip.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getSourceBadgeColor(tip.source as TipSource)}>
                          {tip.source.charAt(0).toUpperCase() + tip.source.slice(1).replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {tip.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/upload-tip?edit=${tip.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-primary">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-600 hover:text-red-600"
                                onClick={() => setTipToDelete(tip.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete
                                  the tip entry from your records.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setTipToDelete(null)}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteTip}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
