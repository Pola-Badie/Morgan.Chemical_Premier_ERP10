import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import PageNavigation from "@/components/PageNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePagination } from "@/contexts/PaginationContext";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, Settings, User, LogOut, Moon, Sun, Bell } from "lucide-react";
import EnhancedNotifications from "@/components/EnhancedNotifications";
import LanguageSelector from "@/components/LanguageSelector";
import { ProfileDialog } from "@/components/dialogs/ProfileDialog";
import { SettingsDialog } from "@/components/dialogs/SettingsDialog";
import { LogoutDialog } from "@/components/dialogs/LogoutDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { language, isRTL, t } = useLanguage();
  const { currentPage, setCurrentPage, getTotalPages } = usePagination();
  const { isCollapsed } = useSidebarContext();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Handle resize events
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const totalPages = getTotalPages(totalItems);

  return (
    <div className={`flex h-screen bg-slate-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ${isRTL ? 'md:right-0' : 'md:left-0'} ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}>
        <Sidebar />
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeMobileMenu}
          />
          <div className={`fixed top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isRTL 
              ? 'right-0 rounded-l-xl' 
              : 'left-0 rounded-r-xl'
          }`}>
            <Sidebar isMobile onClose={closeMobileMenu} />
          </div>
        </div>
      )}
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isRTL ? (isCollapsed ? 'md:pr-16' : 'md:pr-64') : (isCollapsed ? 'md:pl-16' : 'md:pl-64')}`}>
        {/* Desktop Header */}
        <div className="hidden md:flex border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between w-full">
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <img 
                src="/attached_assets/Untitled design-7_1749347391766.png" 
                alt="Morgan ERP Logo" 
                className="w-12 h-12 object-contain"
              />
              <h1 className="font-semibold text-gray-900 text-[20px]">Premier ERP System</h1>
            </div>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              {/* Language Selector */}
              <LanguageSelector />
              
              {/* Enhanced Notifications */}
              <EnhancedNotifications />

              {/* Enhanced Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-12 w-12 rounded-full p-0 border-2 border-transparent hover:border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group"
                  >
                    <div className="relative">
                      <img
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md group-hover:ring-blue-300 transition-all duration-200"
                        src={user?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"}
                        alt={user?.name || "User"}
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-0 shadow-xl border-0 bg-white/95 backdrop-blur-md rounded-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-xl">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="relative">
                        <img
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                          src={user?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"}
                          alt={user?.name || "User"}
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full"></div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-gray-900">{user?.name || "User"}</p>
                        <p className="text-sm text-gray-600">
                          {user?.email || "user@morganerp.com"}
                        </p>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-3 py-1">
                          {user?.role || "Administrator"}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  
                  <div className="p-3 space-y-1">
                    <DropdownMenuItem 
                      onClick={() => setProfileDialogOpen(true)}
                      className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-full mr-3 transition-colors duration-200">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">My Profile</span>
                        <span className="text-xs text-gray-500">View and edit profile</span>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => setSettingsDialogOpen(true)}
                      className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-full mr-3 transition-colors duration-200">
                        <Settings className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Settings</span>
                        <span className="text-xs text-gray-500">Preferences & privacy</span>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/notifications" className="flex items-center px-4 py-3 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 cursor-pointer group">
                        <div className="flex items-center justify-center w-10 h-10 bg-amber-100 group-hover:bg-amber-200 rounded-full mr-3 transition-colors duration-200">
                          <Bell className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Notifications</span>
                          <span className="text-xs text-gray-500">Alerts & updates</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  
                  <DropdownMenuSeparator className="mx-3" />
                  
                  <div className="p-3">
                    <DropdownMenuItem 
                      onClick={() => setLogoutDialogOpen(true)} 
                      className="flex items-center px-4 py-3 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-200 cursor-pointer text-red-600 group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-full mr-3 transition-colors duration-200">
                        <LogOut className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Sign Out</span>
                        <span className="text-xs text-red-400">End your session</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Top Nav (Mobile) */}
        <div className={`md:hidden border-b border-slate-200 bg-white px-3 py-3 sticky top-0 z-30 ${isRTL ? 'direction-rtl' : ''}`}>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center min-w-0 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                className="text-slate-600 hover:text-slate-900 p-2 rounded-md hover:bg-slate-100 transition-colors"
                onClick={toggleMobileMenu}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-menu"
                >
                  <line x1="4" x2="20" y1="12" y2="12"></line>
                  <line x1="4" x2="20" y1="6" y2="6"></line>
                  <line x1="4" x2="20" y1="18" y2="18"></line>
                </svg>
              </button>
              <div className={`flex items-center min-w-0 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                <img 
                  src="/attached_assets/Untitled design-7_1749347391766.png" 
                  alt="Morgan ERP Logo" 
                  className="w-8 h-8 object-contain flex-shrink-0"
                />
                <span className={`font-bold text-base truncate ${isRTL ? 'mr-2' : 'ml-2'}`}>Premier ERP System</span>
              </div>
            </div>
            <div className={`flex items-center space-x-1 flex-shrink-0 ${isRTL ? 'space-x-reverse' : ''}`}>
              {/* Mobile Language Selector */}
              <LanguageSelector />
              
              {/* Mobile Enhanced Notifications */}
              <EnhancedNotifications />

              {/* Mobile Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <img
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                      src={user?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"}
                      alt={user?.name || "User"}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mr-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-3">
                        <img
                          className="w-10 h-10 rounded-full object-cover"
                          src={user?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"}
                          alt={user?.name || "User"}
                        />
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-medium leading-none truncate">{user?.name || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                            {user?.email || "user@morganerp.com"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileDialogOpen(true)} className="py-3">
                    <User className="mr-3 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)} className="py-3">
                    <Settings className="mr-3 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="flex items-center py-3">
                      <Bell className="mr-3 h-4 w-4" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)} className="py-3 text-red-600">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-full">
            <div className="mb-2 sm:mb-3">
              <PageNavigation />
            </div>
            <div className="w-full overflow-x-auto">
              {children}
            </div>
          </div>
        </main>

        {/* Bottom Navigation (Mobile) */}
        <MobileNav />
      </div>
      {/* Dialog Components */}
      <ProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
      <SettingsDialog 
        open={settingsDialogOpen} 
        onOpenChange={setSettingsDialogOpen} 
      />
      <LogoutDialog 
        open={logoutDialogOpen} 
        onOpenChange={setLogoutDialogOpen} 
      />
    </div>
  );
};

export default MainLayout;