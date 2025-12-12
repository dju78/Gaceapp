import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { NotificationPanel } from "./NotificationPanel";
import { Breadcrumbs } from "./Breadcrumbs";
import { ProductTour, DASHBOARD_TOUR, useTour, TourButton } from "./tour/ProductTour";
import {
  LayoutDashboard,
  Globe,
  Brain,
  AlertTriangle,
  FileText,
  HelpCircle,
  Bell,
  Upload,
  User,
  LogOut,
  Building2,
  FileBarChart,
} from "lucide-react";

type UserType = "end-user" | "accountant" | "admin";

interface DashboardLayoutProps {
  userType: UserType;
  adminRole?: "support" | "compliance" | "super";
}

interface NavItem {
  path: string;
  label: string;
  icon: React.FC<any>;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  userType,
  adminRole,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { isTourOpen, startTour, closeTour, completeTour, hasCompletedTour } = useTour(DASHBOARD_TOUR);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "alert" as const,
      title: "Nigeria Tax Filing Deadline",
      message: "Your Nigeria 2025 tax return is due in 14 days",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: "2",
      type: "report" as const,
      title: "HMRC Report Generated",
      message: "Your UK Self Assessment report is ready for review",
      time: "5 hours ago",
      unread: true,
    },
    {
      id: "3",
      type: "update" as const,
      title: "DTA Rate Update",
      message: "New Double Taxation Agreement rates published for UK-Nigeria",
      time: "1 day ago",
      unread: true,
    },
  ]);

  const notificationCount = notifications.filter((n) => n.unread).length;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const userLabel =
    userType === "end-user" ? "Investor / End User" : "Accountant";

  const navigationItems: NavItem[] = [
    {
      path: "/dashboard/overview",
      label: "Compliance Overview",
      icon: LayoutDashboard,
    },
    {
      path: "/dashboard/assets",
      label: "Asset Manager",
      icon: Building2,
    },
    {
      path: "/dashboard/documents",
      label: "Document Ingestion",
      icon: Upload,
    },
    {
      path: "/dashboard/scanner",
      label: "Global Asset Scanner",
      icon: Globe,
    },
    {
      path: "/dashboard/tax-engine",
      label: "ML Tax Engine",
      icon: Brain,
    },
    {
      path: "/dashboard/alerts",
      label: "Compliance Alerts",
      icon: AlertTriangle,
    },
    {
      path: "/dashboard/reports",
      label: "HMRC Reports",
      icon: FileText,
    },
    {
      path: "/dashboard/self-assessment",
      label: "Self Assessment",
      icon: FileBarChart,
    },
    {
      path: "/dashboard/help",
      label: "Help & Documentation",
      icon: HelpCircle,
    },
  ];

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleClearAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setIsNotificationPanelOpen(false);
  };

  const handleViewAllAlerts = () => {
    navigate("/dashboard/alerts");
    setIsNotificationPanelOpen(false);
    handleClearAll();
  };

  const handleAlertNavClick = () => {
    if (location.pathname === "/dashboard/alerts") {
      handleClearAll();
    }
  };

  const getCurrentLabel = () => {
    const currentItem = navigationItems.find(
      (item) => item.path === location.pathname
    );
    return currentItem?.label || "Dashboard";
  };

  return (
    <div className="tech-grid flex min-h-screen bg-slate-950">
      {/* Left Sidebar Navigation */}
      <aside className="glass relative w-64 border-r border-indigo-500/20">
        {/* Logo */}
        <div className="border-b border-indigo-500/20 p-4">
          <div>
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-lg font-semibold text-transparent">
              GACE
            </div>
            <div className="text-sm text-slate-400">
              Global Asset Compliance
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (item.path === "/dashboard/alerts") {
                      handleAlertNavClick();
                    }
                  }}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                      isActive
                        ? "glow-blue border border-indigo-500/50 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-cyan-300"
                        : "text-slate-400 hover:border hover:border-indigo-500/30 hover:bg-indigo-950/30 hover:text-slate-200"
                    }`
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-cyan-400" : ""}`} />
                  <span className="font-medium">{item.label}</span>

                  {item.path === "/dashboard/alerts" && notificationCount > 0 && (
                    <span className="glow-pink ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-[10px] font-bold text-white">
                      {notificationCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-indigo-500/20 bg-slate-950/90 p-4">
          <div className="flex items-center gap-3">
            <div className="glow-cyan flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-xs font-semibold">
              DJO
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-100">
                Daramola
              </div>
              <div className="text-[10px] text-slate-400">{userLabel}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Top Header */}
        <header className="glass border-b border-indigo-500/20">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Breadcrumbs />
              <h1 className="mt-1 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-lg font-semibold text-transparent">
                {getCurrentLabel()}
              </h1>
              <p className="text-xs text-slate-400">
                UK Tax Year 2025/26 • Nigeria 2025
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Tour Button */}
              {!hasCompletedTour && location.pathname === "/dashboard/overview" && (
                <TourButton onClick={startTour} label="Take Tour" />
              )}

              {/* Jurisdiction selector */}
              <div className="hidden items-center gap-2 rounded-full border border-indigo-500/30 bg-slate-900/50 px-4 py-2 text-xs text-slate-300 md:flex">
                <span className="glow-cyan inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                <span className="font-semibold text-cyan-300">
                  UK 2025/26
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-purple-300">Nigeria 2025</span>
              </div>

              {/* Current user chip */}
              <div className="hidden items-center gap-2 rounded-full border border-indigo-500/30 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 md:flex">
                <User className="h-4 w-4 text-cyan-300" />
                <span className="font-semibold">Daramola</span>
                <span className="text-[10px] text-slate-400">{userLabel}</span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() =>
                    setIsNotificationPanelOpen(!isNotificationPanelOpen)
                  }
                  className="relative rounded-full border border-indigo-500/30 bg-slate-900/50 p-2.5 transition-all hover:border-cyan-500 hover:bg-indigo-950/50 hover:glow-blue"
                  aria-label={`View compliance notifications${
                    notificationCount > 0 ? ` (${notificationCount} unread)` : ""
                  }`}
                >
                  {notificationCount > 0 && (
                    <span className="glow-pink absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-[9px] font-bold text-white">
                      {notificationCount}
                    </span>
                  )}
                  <Bell className="h-5 w-5 text-cyan-400" />
                </button>

                <NotificationPanel
                  isOpen={isNotificationPanelOpen}
                  onClose={() => setIsNotificationPanelOpen(false)}
                  notifications={notifications}
                  onViewAll={handleViewAllAlerts}
                  onMarkAsRead={handleMarkAsRead}
                  onClearAll={handleClearAll}
                />
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full border border-rose-500/40 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-rose-100 transition-all hover:border-rose-400 hover:bg-rose-950/60"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Section Content - Rendered by nested routes */}
        <main className="p-6">
          <ProductTour 
            steps={DASHBOARD_TOUR} 
            isOpen={isTourOpen} 
            onClose={closeTour}
            onComplete={completeTour}
          />
          <Outlet />
        </main>
      </div>
    </div>
  );
};