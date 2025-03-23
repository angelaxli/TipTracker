import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { PlusCircle, FileText, BarChart2, List } from "lucide-react";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/upload-tip">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer flex items-center">
              <PlusCircle className="text-primary h-6 w-6 mr-4" />
              <div>
                <h3 className="font-medium text-gray-800">Upload Tip</h3>
                <p className="text-sm text-gray-600">Add a new tip to your earnings</p>
              </div>
            </div>
          </Link>
          
          <Link href="/upload-tip?scan=true">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer flex items-center">
              <FileText className="text-primary h-6 w-6 mr-4" />
              <div>
                <h3 className="font-medium text-gray-800">Scan Receipt</h3>
                <p className="text-sm text-gray-600">Extract tip information from a receipt</p>
              </div>
            </div>
          </Link>
          
          <Link href="/earnings-graph">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer flex items-center">
              <BarChart2 className="text-primary h-6 w-6 mr-4" />
              <div>
                <h3 className="font-medium text-gray-800">Graph View</h3>
                <p className="text-sm text-gray-600">Visualize your earnings data</p>
              </div>
            </div>
          </Link>
          
          <Link href="/earnings-log">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer flex items-center">
              <List className="text-primary h-6 w-6 mr-4" />
              <div>
                <h3 className="font-medium text-gray-800">Earnings Log</h3>
                <p className="text-sm text-gray-600">View detailed earnings history</p>
              </div>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
