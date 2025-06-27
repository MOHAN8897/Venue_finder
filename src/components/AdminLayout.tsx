import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Drawer, List, ListItemIcon, ListItemText, Box, CssBaseline, Divider, Avatar, Menu, MenuItem, useTheme, useMediaQuery, ListItemButton, Paper, InputBase } from '@mui/material';
import { Menu as MenuIcon, Dashboard, Business, People, BarChart, Settings } from '@mui/icons-material';

const drawerWidth = 240;

const sections = [
  { label: 'Dashboard', icon: <Dashboard />, value: 0 },
  { label: 'Venue Management', icon: <Business />, value: 1 },
  { label: 'User Management', icon: <People />, value: 2 },
  { label: 'Reports & Analytics', icon: <BarChart />, value: 3 },
  { label: 'Admin Settings', icon: <Settings />, value: 4 },
  { label: 'Admin Management', icon: <Settings />, value: 5 },
];

interface AdminLayoutProps {
  tab: number;
  onTabChange: (tab: number) => void;
  onLogout: () => void;
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ tab, onTabChange, onLogout, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleMenuSettings = () => {
    handleProfileMenuClose();
    onTabChange(4); // Admin Settings tab
  };

  const handleMenuLogout = () => {
    handleProfileMenuClose();
    onLogout();
  };

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: '#f7f8fa', borderRadius: 4, m: 1, boxShadow: 2, display: 'flex', flexDirection: 'column', p: 1 }}>
      <Divider sx={{ mb: 2 }} />
      <List sx={{ flexGrow: 1 }}>
        {sections.map((section) => (
          <ListItemButton
            key={section.label}
            selected={tab === section.value}
            onClick={() => onTabChange(section.value)}
            sx={{
              borderRadius: 2,
              mb: 1,
              bgcolor: tab === section.value ? 'primary.100' : 'transparent',
              '&:hover': { bgcolor: 'primary.50' },
              transition: 'background 0.2s',
            }}
          >
            <ListItemIcon sx={{ color: tab === section.value ? 'primary.main' : 'grey.700' }}>{section.icon}</ListItemIcon>
            <ListItemText primary={section.label} primaryTypographyProps={{ fontWeight: tab === section.value ? 700 : 500 }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f3f4f8' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'white', color: 'text.primary', boxShadow: 2, borderRadius: 3, mx: 2, mt: 2, width: { md: `calc(100% - ${drawerWidth + 32}px)` }, left: { md: drawerWidth + 16 } }}>
        <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Paper component="form" sx={{ p: '2px 8px', display: 'flex', alignItems: 'center', width: 320, borderRadius: 2, boxShadow: 0, bgcolor: '#f7f8fa', mr: 2 }}>
            <InputBase sx={{ ml: 1, flex: 1 }} placeholder="Search anything..." inputProps={{ 'aria-label': 'search' }} />
          </Paper>
          <Box sx={{ flexGrow: 1 }} />
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#e53935',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, p: 0 }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: 'transparent',
              boxShadow: 'none',
              border: 0,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: 10 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout; 