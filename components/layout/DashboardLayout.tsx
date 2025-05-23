// components/layout/DashboardLayout.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';

// Navigation items for the sidebar
const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Creators', icon: <ChatIcon />, path: '/creators' },
  { text: 'Users', icon: <PeopleIcon />, path: '/users' },
  { text: 'Vector Search', icon: <SearchIcon />, path: '/search' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

// Drawer width
const drawerWidth = 240;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { mode, toggleColorMode } = useTheme();
  const { user, logout } = useAuth();
  const muiTheme = useMuiTheme();
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top app bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle drawer"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <ChatIcon sx={{ color: 'primary.main' }} />
            ChatsAssistant
          </Typography>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Theme toggle */}
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            
            {/* Notifications */}
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            {/* User profile */}
            <Tooltip title={`Logged in as ${user?.email}`}>
              <IconButton sx={{ ml: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 32,
                    height: 32,
                  }}
                >
                  {user?.email?.charAt(0).toUpperCase() || <PersonIcon />}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            {/* Logout */}
            <Tooltip title="Logout">
              <IconButton color="inherit" sx={{ ml: 1 }} onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 64,
          flexShrink: 0,
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 64,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            backgroundColor: mode === 'light' ? '#f4ebf9' : '#2d2d2d',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {navItems.map((item) => {
              const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
              
              return (
                <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                  <Link href={item.path} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItemButton
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        backgroundColor: isActive ? 'primary.light' : 'transparent',
                        borderRight: isActive ? `4px solid ${muiTheme.palette.primary.main}` : 'none',
                        '&:hover': {
                          backgroundColor: isActive 
                            ? 'primary.light' 
                            : mode === 'light' 
                              ? 'rgba(210, 179, 226, 0.1)' 
                              : 'rgba(210, 179, 226, 0.05)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 3 : 'auto',
                          justifyContent: 'center',
                          color: isActive ? 'primary.main' : 'text.primary',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        sx={{ 
                          opacity: open ? 1 : 0,
                          color: isActive ? 'primary.main' : 'text.primary',
                          fontWeight: isActive ? 600 : 400,
                        }} 
                      />
                    </ListItemButton>
                  </Link>
                </ListItem>
              );
            })}
          </List>
          <Divider sx={{ my: 2 }} />
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: 'background.default',
          minHeight: '100vh',
          width: { xs: '100%', sm: `calc(100% - ${open ? drawerWidth : 64}px)` },
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        {children}
      </Box>
    </Box>
  );
}