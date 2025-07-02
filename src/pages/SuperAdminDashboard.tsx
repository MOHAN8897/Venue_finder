import React, { useState, useEffect } from "react";
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
  Download,
  FileText,
  Shield,
  DollarSign,
  Search
} from "lucide-react";
import { supabase } from '../lib/supabase';

const sidebarTabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "venues", label: "Venue Management", icon: Building2 },
  { id: "users", label: "User Management", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Admin Settings", icon: Settings },
  { id: "admins", label: "Admin Management", icon: Shield },
];

interface Venue {
  id: string;
  name: string;
  type: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  approved_at?: string;
  rejected_at?: string;
}

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [venues, setVenues] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [venueTab, setVenueTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [viewMode, setViewMode] = useState<'list' | 'detailed'>('list');
  const [selectedVenue, setSelectedVenue] = useState<unknown | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [search, setSearch] = useState('');
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [activityLogs, setActivityLogs] = useState<unknown[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  React.useEffect(() => {
    // Always apply dark theme
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
  }, []);

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      setError('');
      const status = venueTab;
      // Fetch venues with user info by joining profiles
      const { data, error } = await supabase
        .from('venues')
        .select(`*, profiles:submitted_by (user_id, email, avatar_url, full_name)`)
        .eq('approval_status', status)
        .order('submission_date', { ascending: false });
      if (error) setError(error.message);
      setVenues(data || []);
      setLoading(false);
    };
    fetchVenues();
  }, [venueTab]);

  const fetchVenueDetails = async (venueId: string) => {
    setDetailsLoading(true);
    setSelectedVenue(null);
    const { data, error } = await supabase.rpc('get_venue_approval_details', { venue_uuid: venueId });
    if (error) setError(error.message);
    setSelectedVenue(data);
    setDetailsLoading(false);
  };

  const handleApprove = async (venueId: string) => {
    setLoading(true);
    const { error } = await supabase.rpc('approve_venue', { venue_uuid: venueId, admin_notes: adminNotes });
    if (error) setError(error.message);
    setVenues(prev => prev.filter(v => v.venue_id !== venueId && v.id !== venueId));
    setSelectedVenue(null);
    setLoading(false);
  };

  const handleReject = async (venueId: string) => {
    setLoading(true);
    const { error } = await supabase.rpc('reject_venue', { venue_uuid: venueId, rejection_reason: rejectionReason, admin_notes: adminNotes });
    if (error) setError(error.message);
    setVenues(prev => prev.filter(v => v.venue_id !== venueId && v.id !== venueId));
    setSelectedVenue(null);
    setLoading(false);
  };

  const stats = {
    pending: venues.length,
    approved: venueTab === 'approved' ? venues.length : undefined,
    rejected: venueTab === 'rejected' ? venues.length : undefined,
  };

  const handleLogout = () => {
    localStorage.removeItem("superAdminSession");
    window.location.href = "/super-admin/login";
  };

  // Fetch activity logs for a venue
  const fetchActivityLogs = async (venueId: string) => {
    setLogsLoading(true);
    setShowLogs(true);
    const { data, error } = await supabase
      .from('venue_approval_logs')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });
    if (!error) setActivityLogs(data || []);
    setLogsLoading(false);
  };

  // Filter venues by search
  const filteredVenues = (venues as any[]).filter((venue) => {
    const email = venue.submitter_email || venue.user_id || '';
    const name = venue.venue_name || venue.name || '';
    const type = venue.venue_type || venue.type || '';
    return (
      email.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      type.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Batch approve/reject
  const handleBatchApprove = async () => {
    setLoading(true);
    for (const venueId of selectedVenues) {
      await supabase.rpc('approve_venue', { venue_uuid: venueId, admin_notes: adminNotes });
    }
    setVenues(prev => prev.filter(v => !selectedVenues.includes(v.venue_id || v.id)));
    setSelectedVenues([]);
    setLoading(false);
  };
  const handleBatchReject = async () => {
    setLoading(true);
    for (const venueId of selectedVenues) {
      await supabase.rpc('reject_venue', { venue_uuid: venueId, rejection_reason: rejectionReason, admin_notes: adminNotes });
    }
    setVenues(prev => prev.filter(v => !selectedVenues.includes(v.venue_id || v.id)));
    setSelectedVenues([]);
    setLoading(false);
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
                <div className="flex gap-2">
                  <Button variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')}>List View</Button>
                  <Button variant={viewMode === 'detailed' ? 'default' : 'ghost'} onClick={() => setViewMode('detailed')}>Detailed View</Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by email, name, or type..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900 bg-white/80 placeholder-gray-400 shadow-sm transition-all duration-200"
                  />
                </div>
                {venueTab === 'pending' && (
                  <>
                    <Button variant="default" disabled={selectedVenues.length === 0} onClick={handleBatchApprove}>Approve Selected</Button>
                    <Button variant="destructive" disabled={selectedVenues.length === 0} onClick={handleBatchReject}>Reject Selected</Button>
                  </>
                )}
              </div>
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
                <Button
                  variant={venueTab === 'pending' ? "default" : "ghost"}
                  className={`flex-1 ${venueTab === 'pending' ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-blue-100 hover:text-blue-900 dark:hover:bg-blue-900 dark:hover:text-white"}`}
                  onClick={() => setVenueTab('pending')}
                >
                  Pending <span className="ml-2 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">{stats.pending}</span>
                </Button>
                <Button
                  variant={venueTab === 'approved' ? "default" : "ghost"}
                  className={`flex-1 ${venueTab === 'approved' ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-blue-100 hover:text-blue-900 dark:hover:bg-blue-900 dark:hover:text-white"}`}
                  onClick={() => setVenueTab('approved')}
                >
                  Approved <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">{stats.approved ?? '-'}</span>
                </Button>
                <Button
                  variant={venueTab === 'rejected' ? "default" : "ghost"}
                  className={`flex-1 ${venueTab === 'rejected' ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-blue-100 hover:text-blue-900 dark:hover:bg-blue-900 dark:hover:text-white"}`}
                  onClick={() => setVenueTab('rejected')}
                >
                  Rejected <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">{stats.rejected ?? '-'}</span>
                </Button>
              </div>
              {/* Venue List or Detailed View */}
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-500 py-12">{error}</div>
              ) : filteredVenues.length === 0 ? (
                <div className="text-center py-12">No {venueTab} venues to display.</div>
              ) : viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVenues.map((venue) => {
                    const v = venue as { id: string; name: string; type: string; submission_date?: string; profiles?: { user_id?: string; email?: string; avatar_url?: string; full_name?: string } };
                    const user = v.profiles || {};
                    return (
                      <div key={v.id} className={`border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 cursor-pointer relative ${selectedVenues.includes(v.id) ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => { fetchVenueDetails(v.id); setViewMode('detailed'); }}>
                        <div className="flex items-center gap-3 mb-2">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {user.email ? user.email[0].toUpperCase() : '?'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{user.full_name || user.email || v.name}</div>
                            <div className="text-xs text-gray-500">{user.email || user.user_id}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">{v.name}</div>
                        <div className="text-xs text-gray-400">{v.type}</div>
                        <div className="text-xs mt-1">Status: <span className="font-semibold capitalize">{venueTab}</span></div>
                        <div className="text-xs text-gray-400">Submitted: {v.submission_date ? new Date(v.submission_date).toLocaleString() : 'N/A'}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Detailed View
                selectedVenue && !detailsLoading ? (
                  (() => {
                    const sv = selectedVenue as any; // TODO: Replace 'any' with a proper VenueDetails type
                    return (
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
                        <div className="flex items-center gap-4 mb-4">
                          {sv.submitter?.avatar_url ? (
                            <img src={sv.submitter.avatar_url} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                              {sv.submitter?.email ? sv.submitter.email[0].toUpperCase() : '?'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-lg">{sv.submitter?.full_name || 'Unknown User'}</div>
                            <div className="text-xs text-gray-500">{sv.submitter?.email}</div>
                            <div className="text-xs text-gray-400">User ID: {sv.venue?.submitted_by}</div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <h3 className="font-bold text-xl mb-2">Venue Details</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {Object.entries(sv.venue).map(([key, value]) => (
                              <div key={key} className="flex justify-between border-b border-gray-200 py-1 text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{key.replace(/_/g, ' ')}</span>
                                <span className="text-gray-900 dark:text-white">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="default" onClick={() => handleApprove(sv.venue.id)}>Approve</Button>
                          <input type="text" placeholder="Admin notes (optional)" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="px-2 py-1 rounded border text-black" />
                          <Button variant="destructive" onClick={() => handleReject(sv.venue.id)}>Reject</Button>
                          <input type="text" placeholder="Rejection reason" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="px-2 py-1 rounded border text-black" />
                          <Button variant="ghost" onClick={() => { setSelectedVenue(null); setViewMode('list'); }}>Back</Button>
                          <Button variant="outline" onClick={() => fetchActivityLogs(sv.venue.id)}>{showLogs ? 'Hide Logs' : 'Show Logs'}</Button>
                        </div>
                        {showLogs && (
                          <div className="mt-6">
                            <h4 className="font-semibold mb-2">Activity Logs</h4>
                            {logsLoading ? (
                              <div>Loading logs...</div>
                            ) : activityLogs.length === 0 ? (
                              <div>No logs found for this venue.</div>
                            ) : (
                              <ul className="space-y-2">
                                {activityLogs.map((log) => {
                                  const l = log as { id: string; action: string; created_at: string; admin_notes?: string; reason?: string };
                                  return (
                                    <li key={l.id} className="border-b border-gray-200 pb-2">
                                      <div className="flex justify-between text-xs">
                                        <span className="font-medium">{l.action.toUpperCase()}</span>
                                        <span>{new Date(l.created_at).toLocaleString()}</span>
                                      </div>
                                      <div className="text-gray-700 dark:text-gray-300">{l.admin_notes || l.reason || '-'}</div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : detailsLoading ? (
                  <div className="text-center py-12">Loading details...</div>
                ) : (
                  <div className="text-center py-12">Select a venue to view details.</div>
                )
              )}
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