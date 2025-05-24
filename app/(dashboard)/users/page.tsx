// app/(dashboard)/users/page.tsx - Enhanced Users Management
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton,
  TextField, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Chip,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Fab,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Switch,
  FormControlLabel,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import KeyIcon from '@mui/icons-material/Key';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SecurityIcon from '@mui/icons-material/Security';
import FilterListIcon from '@mui/icons-material/FilterList';
import GetAppIcon from '@mui/icons-material/GetApp';
import { apiClient } from '../../../lib/api';
import { format } from 'date-fns';

// Enhanced interfaces
interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface UserPreference {
  id: number;
  user_id: number;
  openai_api_key: string | null;
  default_model: string;
  suggestion_count: number;
  selected_creators: number[] | null;
}

interface UserWithPreferences extends User {
  preferences?: UserPreference;
}

interface UsersResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Enhanced form validation schemas
const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  is_admin: z.boolean(),
  is_active: z.boolean(),
  openai_api_key: z.string().optional(),
  default_model: z.string(),
  suggestion_count: z.number().int().min(1).max(10),
});

const editUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  is_admin: z.boolean(),
  is_active: z.boolean(),
  is_verified: z.boolean(),
});

const resetPasswordSchema = z.object({
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Default models for OpenAI
const models = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];

export default function UsersPage() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewUserOpen, setViewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPreferences | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'admin'>('all');
  const [showApiKey, setShowApiKey] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [userStats, setUserStats] = useState({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    admin_users: 0,
    verified_users: 0,
    unverified_users: 0,
  });
  const [bulkSelection, setBulkSelection] = useState<number[]>([]);

  // Forms
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      is_admin: false,
      is_active: true,
      openai_api_key: '',
      default_model: 'gpt-4',
      suggestion_count: 3,
    },
  });

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
  });

  const passwordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: '',
    },
  });

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
      };
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      if (statusFilter === 'active') {
        params.is_active = true;
      } else if (statusFilter === 'inactive') {
        params.is_active = false;
      } else if (statusFilter === 'admin') {
        params.is_admin = true;
      }
      
      const response = await apiClient.get<UsersResponse>('/users/', { params });
      
      setUsers(response.items || []);
      setTotalUsers(response.total || 0);
      setTotalPages(response.pages || 1);
      
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load users');
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const stats = await apiClient.get('/users/stats/summary');
      setUserStats(stats);
    } catch (err) {
      console.warn('Failed to fetch user stats:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [page, rowsPerPage]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 0) {
        fetchUsers();
      } else {
        setPage(0); // This will trigger fetchUsers via the effect above
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter]);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle menu actions
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  // Handle create user
  const handleCreateUser = () => {
    createForm.reset();
    setDialogOpen(true);
  };

  // Handle edit user
  const handleEditUser = async (user: User) => {
    try {
      const userWithPrefs = await apiClient.get<UserWithPreferences>(`/users/${user.id}`);
      setSelectedUser(userWithPrefs);
      editForm.reset({
        email: userWithPrefs.email,
        is_admin: userWithPrefs.is_admin,
        is_active: userWithPrefs.is_active,
        is_verified: userWithPrefs.is_verified,
      });
      setEditDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load user details');
    }
    handleMenuClose();
  };

  // Handle view user
  const handleViewUser = async (user: User) => {
    try {
      const userWithPrefs = await apiClient.get<UserWithPreferences>(`/users/${user.id}`);
      setSelectedUser(userWithPrefs);
      setViewUserOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load user details');
    }
    handleMenuClose();
  };

  // Handle delete user
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Handle reset password
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    passwordForm.reset();
    setResetPasswordDialogOpen(true);
    handleMenuClose();
  };

  // Form submissions
  const onCreateSubmit: SubmitHandler<CreateUserFormValues> = async (data) => {
    setError(null);
    setSuccess(null);
    
    try {
      await apiClient.post('/users/', data);
      setSuccess('User created successfully. An email has been sent to the user for account setup.');
      setDialogOpen(false);
      await fetchUsers();
      await fetchUserStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create user');
    }
  };

  const onEditSubmit: SubmitHandler<EditUserFormValues> = async (data) => {
    if (!selectedUser) return;
    
    setError(null);
    setSuccess(null);
    
    try {
      await apiClient.patch(`/users/${selectedUser.id}`, data);
      setSuccess('User updated successfully');
      setEditDialogOpen(false);
      await fetchUsers();
      await fetchUserStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update user');
    }
  };

  const onPasswordSubmit: SubmitHandler<ResetPasswordFormValues> = async (data) => {
    if (!selectedUser) return;
    
    setError(null);
    setSuccess(null);
    
    try {
      await apiClient.post(`/users/${selectedUser.id}/reset-password`, data);
      setSuccess('Password reset successfully');
      setResetPasswordDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to reset password');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await apiClient.delete(`/users/${selectedUser.id}`);
      setSuccess('User deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await fetchUsers();
      await fetchUserStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete user');
    }
  };

  // Handle user status toggle
  const handleStatusToggle = async (user: User) => {
    try {
      if (user.is_active) {
        await apiClient.post(`/users/${user.id}/deactivate`);
        setSuccess(`User deactivated successfully`);
      } else {
        await apiClient.post(`/users/${user.id}/activate`);
        setSuccess(`User activated successfully`);
      }
      await fetchUsers();
      await fetchUserStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update user status');
    }
  };

  // Handle admin role toggle
  const handleAdminToggle = async (user: User) => {
    try {
      if (user.is_admin) {
        await apiClient.post(`/users/${user.id}/remove-admin`);
        setSuccess(`Admin privileges removed successfully`);
      } else {
        await apiClient.post(`/users/${user.id}/make-admin`);
        setSuccess(`Admin privileges granted successfully`);
      }
      await fetchUsers();
      await fetchUserStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update user role');
    }
  };

  // Bulk operations
  const handleBulkActivate = async () => {
    if (bulkSelection.length === 0) return;
    
    try {
      await apiClient.post('/users/bulk-activate', bulkSelection);
      setSuccess(`Successfully activated ${bulkSelection.length} users`);
      setBulkSelection([]);
      await fetchUsers();
      await fetchUserStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to activate users');
    }
  };

  const handleBulkDeactivate = async () => {
    if (bulkSelection.length === 0) return;
    
    try {
      await apiClient.post('/users/bulk-deactivate', bulkSelection);
      setSuccess(`Successfully deactivated ${bulkSelection.length} users`);
      setBulkSelection([]);
      await fetchUsers();
      await fetchUserStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to deactivate users');
    }
  };

  // Export users
  const handleExportUsers = async () => {
    try {
      // In a real implementation, this would download a CSV file
      const allUsers = await apiClient.get<UsersResponse>('/users/', { 
        params: { limit: 10000 } // Get all users
      });
      
      const csvContent = [
        'ID,Email,Status,Role,Verified,Created,Updated',
        ...allUsers.items.map(user => 
          `${user.id},${user.email},${user.is_active ? 'Active' : 'Inactive'},${user.is_admin ? 'Admin' : 'User'},${user.is_verified ? 'Yes' : 'No'},${user.created_at},${user.updated_at}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Users exported successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to export users');
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const maskApiKey = (key: string | null) => {
    if (!key) return '—';
    if (showApiKey) return key;
    const prefix = key.slice(0, 7);
    const suffix = key.slice(-4);
    const maskedPart = '•'.repeat(10);
    return `${prefix}...${maskedPart}...${suffix}`;
  };

  return (
    <Box>
      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Users
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage user accounts and permissions
            {totalUsers > 0 && (
              <Typography component="span" sx={{ ml: 1, fontWeight: 500 }}>
                ({totalUsers} total)
              </Typography>
            )}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportUsers}
            disabled={totalUsers === 0}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {userStats.total_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {userStats.active_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {userStats.inactive_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inactive Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h4" color="secondary.main" fontWeight="bold">
                {userStats.admin_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admin Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {userStats.verified_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verified Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {userStats.unverified_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unverified Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search users by email..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Filter"
              onChange={(e) => setStatusFilter(e.target.value as any)}
              startAdornment={<FilterListIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="active">Active Only</MenuItem>
              <MenuItem value="inactive">Inactive Only</MenuItem>
              <MenuItem value="admin">Admins Only</MenuItem>
            </Select>
          </FormControl>
          
          {bulkSelection.length > 0 && (
            <>
              <Divider orientation="vertical" flexItem />
              <Typography variant="body2" color="text.secondary">
                {bulkSelection.length} selected
              </Typography>
              <Button
                size="small"
                onClick={handleBulkActivate}
                startIcon={<PersonIcon />}
              >
                Activate
              </Button>
              <Button
                size="small"
                onClick={handleBulkDeactivate}
                startIcon={<PersonOffIcon />}
              >
                Deactivate
              </Button>
              <Button
                size="small"
                onClick={() => setBulkSelection([])}
              >
                Clear
              </Button>
            </>
          )}
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {searchQuery || statusFilter !== 'all' ? 'No users found matching your criteria.' : 'No users found.'}
            </Typography>
            {!searchQuery && statusFilter === 'all' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateUser}
                sx={{ mt: 2 }}
              >
                Add Your First User
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      {/* Bulk selection checkbox - implement if needed */}
                    </TableCell>
                    <TableCell><strong>User</strong></TableCell>
                    <TableCell align="center"><strong>Role</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Verified</strong></TableCell>
                    <TableCell><strong>Created</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell padding="checkbox">
                        {/* Implement bulk selection checkbox if needed */}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: user.is_admin ? 'primary.main' : 'grey.400', 
                              width: 32, 
                              height: 32 
                            }}
                          >
                            {user.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {user.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={user.is_admin ? "Admin" : "User"} 
                          color={user.is_admin ? "primary" : "default"}
                          size="small"
                          icon={user.is_admin ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={user.is_active ? "Active" : "Inactive"} 
                          color={user.is_active ? "success" : "default"}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={user.is_verified ? "Verified" : "Unverified"} 
                          color={user.is_verified ? "success" : "warning"}
                          size="small"
                          variant={user.is_verified ? "filled" : "outlined"}
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(user.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, user)}
                        ><MoreVertIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalUsers}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => menuUser && handleViewUser(menuUser)}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => menuUser && handleEditUser(menuUser)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => menuUser && handleResetPassword(menuUser)}>
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => menuUser && handleStatusToggle(menuUser)}>
          <ListItemIcon>
            {menuUser?.is_active ? <PersonOffIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {menuUser?.is_active ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => menuUser && handleAdminToggle(menuUser)}>
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {menuUser?.is_admin ? 'Remove Admin' : 'Make Admin'}
          </ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => menuUser && handleDeleteClick(menuUser)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create a new user account. An email will be sent to the user with instructions to set up their password.
            </Typography>
            
            <Controller
              name="email"
              control={createForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!createForm.formState.errors.email}
                  helperText={createForm.formState.errors.email?.message}
                  autoComplete="email"
                />
              )}
            />
            
            <Controller
              name="password"
              control={createForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!createForm.formState.errors.password}
                  helperText={createForm.formState.errors.password?.message}
                />
              )}
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Controller
                name="is_admin"
                control={createForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Admin Privileges"
                  />
                )}
              />
              
              <Controller
                name="is_active"
                control={createForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Active User"
                  />
                )}
              />
            </Box>
            
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Default Settings
            </Typography>
            
            <Controller
              name="openai_api_key"
              control={createForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="OpenAI API Key (Optional)"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!createForm.formState.errors.openai_api_key}
                  helperText={createForm.formState.errors.openai_api_key?.message || "If not provided, the system will use the default API key"}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                />
              )}
            />
            
            <Controller
              name="default_model"
              control={createForm.control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="model-select-label">Default Model</InputLabel>
                  <Select
                    {...field}
                    labelId="model-select-label"
                    label="Default Model"
                  >
                    {models.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            
            <Controller
              name="suggestion_count"
              control={createForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Suggestion Count"
                  type="number"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!createForm.formState.errors.suggestion_count}
                  helperText={createForm.formState.errors.suggestion_count?.message || "Number of suggestions to generate (1-10)"}
                  InputProps={{
                    inputProps: { min: 1, max: 10 }
                  }}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
            >
              Create User
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
          <DialogContent>
            <Controller
              name="email"
              control={editForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!editForm.formState.errors.email}
                  helperText={editForm.formState.errors.email?.message}
                  autoComplete="email"
                />
              )}
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Controller
                name="is_admin"
                control={editForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Admin Privileges"
                  />
                )}
              />
              
              <Controller
                name="is_active"
                control={editForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Active User"
                  />
                )}
              />
              
              <Controller
                name="is_verified"
                control={editForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Verified User"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
            >
              Update User
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View User Dialog */}
      <Dialog
        open={viewUserOpen}
        onClose={() => setViewUserOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>User Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Account Information
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: selectedUser.is_admin ? 'primary.main' : 'grey.400', width: 60, height: 60 }}>
                        {selectedUser.email.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedUser.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          User ID: {selectedUser.id}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                        <Chip 
                          label={selectedUser.is_admin ? "Admin" : "User"} 
                          color={selectedUser.is_admin ? "primary" : "default"}
                          size="small"
                          icon={selectedUser.is_admin ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={selectedUser.is_active ? "Active" : "Inactive"} 
                          color={selectedUser.is_active ? "success" : "default"}
                          size="small"
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Email Verified</Typography>
                        <Chip 
                          label={selectedUser.is_verified ? "Verified" : "Unverified"} 
                          color={selectedUser.is_verified ? "success" : "warning"}
                          size="small"
                          variant={selectedUser.is_verified ? "filled" : "outlined"}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                        <Typography variant="body2">{formatDate(selectedUser.created_at)}</Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                        <Typography variant="body2">{formatDate(selectedUser.updated_at)}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Preferences
                    </Typography>
                    
                    {selectedUser.preferences ? (
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">OpenAI API Key</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                              {maskApiKey(selectedUser.preferences.openai_api_key)}
                            </Typography>
                            <IconButton size="small" onClick={() => setShowApiKey(!showApiKey)}>
                              {showApiKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Default Model</Typography>
                          <Typography variant="body2">{selectedUser.preferences.default_model}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Suggestion Count</Typography>
                          <Typography variant="body2">{selectedUser.preferences.suggestion_count}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Selected Creators</Typography>
                          <Typography variant="body2">
                            {selectedUser.preferences.selected_creators 
                              ? `${selectedUser.preferences.selected_creators.length} creators selected`
                              : "No creators selected"}
                          </Typography>
                        </Box>
                      </Stack>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        No preferences configured for this user.
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewUserOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
          <DialogContent>
            <DialogContentText>
              {selectedUser && (
                <>
                  Reset password for <strong>{selectedUser.email}</strong>
                </>
              )}
            </DialogContentText>
            
            <Controller
              name="new_password"
              control={passwordForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="New Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!passwordForm.formState.errors.new_password}
                  helperText={passwordForm.formState.errors.new_password?.message}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
            >
              Reset Password
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser && (
              <>
                Are you sure you want to delete <strong>{selectedUser.email}</strong>?
                <br /><br />
                This action cannot be undone. The user will no longer be able to access the system,
                and all their preferences will be deleted.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add user"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleCreateUser}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}