import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { 
  BarChart3, 
  Users, 
  Building2, 
  Settings, 
  LogOut,
  AlertTriangle,
  Activity,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  Shield,
  DollarSign
} from "lucide-react";

const sidebarTabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "venues", label: "Venue Management", icon: Building2 },
  { id: "users", label: "User Management", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Admin Settings", icon: Settings },
  { id: "admins", label: "Admin Management", icon: Shield },
];

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [venueTab, setVenueTab] = useState("pending");

  React.useEffect(() => {
    // Always apply dark theme
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("superAdminSession");
    window.location.href = "/super-admin/login";
  };

  return (
    <div className="flex h-screen dark bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-gray-800 border-r border-gray-700 shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8 text-white">Super Admin</h1>
          <nav className="space-y-2">
            {sidebarTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === tab.id 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "hover:bg-blue-900 hover:text-white"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.label}
              </Button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {sidebarTabs.find(tab => tab.id === activeTab)?.label}
            </h2>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-700 border-red-600 hover:border-red-700">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
        </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-900">
          {activeTab === "dashboard" && (
            <section className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">Last updated: Just now</span>
              </div>
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">-</p>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">No data available</span>
        </div>
      </div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">-</p>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">No data available</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Venues</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">-</p>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">No data available</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approvals</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">-</p>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">No data available</span>
        </div>
          </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
      </div>
      </div>
    </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Growth</h3>
                    <Button variant="link" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium p-0 h-auto">View details</Button>
                  </div>
                  <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">Chart will appear here</p>
                    </div>
            </div>
        </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                    <Button variant="link" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium p-0 h-auto">View all</Button>
            </div>
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
        </div>
      </div>
          </div>
            </section>
          )}

          {activeTab === "venues" && (
            <section className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Venue Management</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Venue
                </Button>
              </div>
              
              {/* Venue Management Tabs */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
                  <Button
                    variant={venueTab === "pending" ? "default" : "ghost"}
                    className={`flex-1 ${
                      venueTab === "pending" 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "hover:bg-blue-100 hover:text-blue-900 dark:hover:bg-blue-900 dark:hover:text-white"
                    }`}
                    onClick={() => setVenueTab("pending")}
                  >
                    Pending
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">0</span>
                  </Button>
                  <Button
                    variant={venueTab === "approved" ? "default" : "ghost"}
                    className={`flex-1 ${
                      venueTab === "approved" 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "hover:bg-blue-100 hover:text-blue-900 dark:hover:bg-blue-900 dark:hover:text-white"
                    }`}
                    onClick={() => setVenueTab("approved")}
                  >
                    Approved
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">0</span>
                  </Button>
                  <Button
                    variant={venueTab === "rejected" ? "default" : "ghost"}
                    className={`flex-1 ${
                      venueTab === "rejected" 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "hover:bg-blue-100 hover:text-blue-900 dark:hover:bg-blue-900 dark:hover:text-white"
                    }`}
                    onClick={() => setVenueTab("rejected")}
                  >
                    Rejected
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">0</span>
                  </Button>
      </div>
                
                {/* Tab Content */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search venues..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
      </div>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
    </div>
                  
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">No {venueTab} venues</h3>
                    <p className="text-gray-600 dark:text-gray-400">There are no {venueTab} venues to display.</p>
            </div>
          </div>
        </div>
            </section>
          )}

          {activeTab === "users" && (
            <section className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
        </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">User Management</h3>
                <p className="text-gray-600 dark:text-gray-400">User management features will be implemented here.</p>
      </div>
            </section>
          )}

          {activeTab === "reports" && (
            <section className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h2>
                <div className="flex items-center space-x-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
      </div>
    </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Reports & Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400">Reports and analytics features will be implemented here.</p>
              </div>
            </section>
          )}

          {activeTab === "settings" && (
            <section className="p-8 space-y-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Admin Settings</h3>
                <p className="text-gray-600 dark:text-gray-400">Admin settings features will be implemented here.</p>
              </div>
            </section>
          )}

          {activeTab === "admins" && (
            <section className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Management</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Admin Management</h3>
                <p className="text-gray-600 dark:text-gray-400">Admin management features will be implemented here.</p>
              </div>
            </section>
            )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;