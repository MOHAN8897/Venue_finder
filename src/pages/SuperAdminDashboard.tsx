import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

const SuperAdminDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  // Updated Dashboard Tab with UI stats
  const DashboardTab = () => (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Dashboard Overview</h2>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, minWidth: 200 }}>
          <div style={{ color: '#888', fontSize: 14 }}>Customers</div>
          <div style={{ fontWeight: 700, fontSize: 28, margin: '8px 0' }}>1,293</div>
          <div style={{ color: '#e53935', fontWeight: 600 }}>-36.8%</div>
          <div style={{ color: '#aaa', fontSize: 12 }}>vs last month</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, minWidth: 200 }}>
          <div style={{ color: '#888', fontSize: 14 }}>Balance</div>
          <div style={{ fontWeight: 700, fontSize: 28, margin: '8px 0' }}>256k</div>
          <div style={{ color: '#43a047', fontWeight: 600 }}>+36.8%</div>
          <div style={{ color: '#aaa', fontSize: 12 }}>vs last month</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, minWidth: 200 }}>
          <div style={{ color: '#888', fontSize: 14 }}>New customers today</div>
          <div style={{ fontWeight: 700, fontSize: 22, margin: '8px 0' }}>857</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
            {/* Avatars (placeholder) */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eee', marginRight: 4 }} />
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eee', marginRight: 4 }} />
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eee', marginRight: 4 }} />
            <button style={{ marginLeft: 8, fontWeight: 600, background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer' }}>
              View all
            </button>
          </div>
        </div>
      </div>
      {/* Product view card (placeholder for charts) */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Product view</div>
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
          [Charts will appear here]
        </div>
      </div>
    </div>
  );

  // Placeholder components for other tabs
  const VenueManagementTab = () => {
    // For now, use empty arrays for all venue states
    const [venueTab, setVenueTab] = useState(0);
    const pendingVenues = [];
    const approvedVenues = [];
    const rejectedVenues = [];
  
    const venueTabs = [
      { label: 'Pending', data: pendingVenues, color: 'orange' },
      { label: 'Approved', data: approvedVenues, color: 'green' },
      { label: 'Rejected', data: rejectedVenues, color: 'red' },
    ];
  
    const filteredVenues = venueTabs[venueTab].data;
  
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Venue Management</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {venueTabs.map((tab, idx) => (
            <button
              key={tab.label}
              onClick={() => setVenueTab(idx)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: venueTab === idx ? tab.color : '#eee',
                color: venueTab === idx ? '#fff' : '#333',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {filteredVenues.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 8, padding: 32, textAlign: 'center', color: '#888' }}>
            No data available
          </div>
        ) : (
          <div>
            {/* Render venue cards here */}
          </div>
        )}
      </div>
    );
  };

  const UserManagementTab = () => {
  // For now, use an empty array for users
  const users = [];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>User Management</h2>
      <div style={{ background: '#fff', borderRadius: 8, padding: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 8 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Full Name</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                  No data available
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 8px' }}>{user.name || user.email || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>{user.email}</td>
                  <td style={{ padding: '10px 8px' }}>{user.role}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    {/* Add action buttons here */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportsTab = () => {
  // For now, use empty arrays for all charts
  const venueSubmissionsData = [];
  const approvalRatesData = [];
  const userGrowthData = [];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Reports</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, minWidth: 320, flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Venue Submissions Over Time</div>
          {venueSubmissionsData.length === 0 ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              No data available
            </div>
          ) : (
            <div>[Chart here]</div>
          )}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, minWidth: 320, flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Approval vs. Rejection Rates</div>
          {approvalRatesData.length === 0 ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              No data available
            </div>
          ) : (
            <div>[Chart here]</div>
          )}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, minWidth: 320, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>User Growth Over Time</div>
        {userGrowthData.length === 0 ? (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            No data available
          </div>
        ) : (
          <div>[Chart here]</div>
        )}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontWeight: 700, flexGrow: 1 }}>Export Reports</div>
        <button disabled style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 600, cursor: 'not-allowed' }}>Export CSV</button>
        <button disabled style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #888', background: '#fff', color: '#888', fontWeight: 600, cursor: 'not-allowed' }}>Export PDF</button>
      </div>
    </div>
  );
};

const AdminSettingsTab = () => {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Admin Settings</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, minWidth: 320, flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Account Management</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1976d2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24 }}>SA</div>
            <div>
              <div style={{ fontWeight: 600 }}>Super Admin</div>
              <div style={{ color: '#1976d2', fontSize: 12, marginTop: 4, fontWeight: 600 }}>Super Admin</div>
            </div>
          </div>
          <button style={{ marginRight: 12, padding: '8px 16px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Change Password</button>
          <button style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 600, cursor: 'pointer' }}>Update Profile</button>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24, minWidth: 320, flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Panel Branding & Settings</div>
          <div style={{ color: '#888' }}>Panel branding and system-wide settings will be available in a future update.</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee', padding: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Activity Logs (Audit Trail)</div>
        <div style={{ color: '#888' }}>Activity logs will be available in a future update.</div>
      </div>
    </div>
  );
};

const AdminManagementTab = () => {
  // For now, use an empty array for admins
  const admins = [];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Admin Management</h2>
      <div style={{ background: '#fff', borderRadius: 8, padding: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 8 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Email/Username</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Roles/Permissions</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Last Login</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                  No data available
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 8px' }}>{admin.name}</td>
                  <td style={{ padding: '10px 8px' }}>{admin.email}</td>
                  <td style={{ padding: '10px 8px' }}>
                    {(admin.roles || []).map((role) => (
                      <span key={role} style={{ background: '#eee', borderRadius: 4, padding: '2px 8px', marginRight: 4, fontSize: 12 }}>{role}</span>
                    ))}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>{admin.lastLogin}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{
                      background: admin.isActive ? '#43a047' : '#aaa',
                      color: '#fff',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 12
                    }}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    {/* Add action buttons here */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


  const renderTabContent = () => {
    switch (currentTab) {
      case 0: return <DashboardTab />;
      case 1: return <VenueManagementTab />;
      case 2: return <UserManagementTab />;
      case 3: return <ReportsTab />;
      case 4: return <AdminSettingsTab />;
      case 5: return <AdminManagementTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <AdminLayout tab={currentTab} onTabChange={setCurrentTab} onLogout={() => {}}>
      {renderTabContent()}
    </AdminLayout>
  );
};

export default SuperAdminDashboard;
