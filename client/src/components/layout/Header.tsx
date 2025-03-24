import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { ChevronLeft, LogOut, Home, BarChart2, List, PlusCircle } from "lucide-react";

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function Header({ showBackButton = false, title = "TipTracker" }: HeaderProps) {
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  // Demo user info
  const demoUser = {
    name: "Demo User",
    initials: "DU"
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-gray-600 hover:text-gray-800"
              onClick={() => navigate("/")}
            >
              <ChevronLeft size={20} />
            </Button>
          )}
          <Link href="/" className="text-lg font-medium text-primary mr-6">
            {title}
          </Link>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <Button variant={isActive("/") ? "default" : "ghost"} size="sm" className="flex items-center">
                <Home size={16} className="mr-1" />
                Dashboard
              </Button>
            </Link>
            <Link href="/upload-tip">
              <Button variant={isActive("/upload-tip") ? "default" : "ghost"} size="sm" className="flex items-center">
                <PlusCircle size={16} className="mr-1" />
                Add Tip
              </Button>
            </Link>
            <Link href="/earnings-graph">
              <Button variant={isActive("/earnings-graph") ? "default" : "ghost"} size="sm" className="flex items-center">
                <BarChart2 size={16} className="mr-1" />
                Graph
              </Button>
            </Link>
            <Link href="/earnings-log">
              <Button variant={isActive("/earnings-log") ? "default" : "ghost"} size="sm" className="flex items-center">
                <List size={16} className="mr-1" />
                Log
              </Button>
            </Link>
            <Link href="/trend-analysis">
              <Button variant={isActive("/trend-analysis") ? "default" : "ghost"} size="sm" className="flex items-center">
                <BarChart2 size={16} className="mr-1" />
                Trends
              </Button>
            </Link>
            <Link href="/advanced-analytics">
              <Button variant={isActive("/advanced-analytics") ? "default" : "ghost"} size="sm" className="flex items-center">
                <PieChart size={16} className="mr-1" />
                Analytics
              </Button>
            </Link>
          </nav>
        </div>
        
        {/* Mobile Menu & User Menu */}
        <div className="flex items-center">
          {/* Mobile Navigation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden mr-2">
              <Button variant="outline" size="sm">
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/">
                  <div className="flex items-center">
                    <Home size={16} className="mr-2" />
                    Dashboard
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/upload-tip">
                  <div className="flex items-center">
                    <PlusCircle size={16} className="mr-2" />
                    Add Tip
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/earnings-graph">
                  <div className="flex items-center">
                    <BarChart2 size={16} className="mr-2" />
                    Graph View
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/earnings-log">
                  <div className="flex items-center">
                    <List size={16} className="mr-2" />
                    Earnings Log
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{demoUser.initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-medium text-sm">
                {demoUser.name}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
