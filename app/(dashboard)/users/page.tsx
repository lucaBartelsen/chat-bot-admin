// app/(dashboard)/users/page.tsx
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
import { apiClient } from '../../../lib/api';
import { format } from 'date-fns';

// User interface
interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// User preferences
interface UserPreference {
  id: number;
  user_id: number;
  openai_api_key: string | null;
  default_model: string;
  suggestion_count: number;
  selected_creators: number[] | null;
}

// Create user form validation schema
const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  is_admin: z.boolean(), // Remove .default() to make it required
  openai_api_key: z.string().nullable(), // Remove .default() 
  default_model: z.string(), // Remove .default()
  suggestion_count: z.number().int().min(1).max(10), // Remove .default()
});

// Form type from schema
type CreateUserFormValues = z.infer<typeof createUserSchema>;

// Default models for OpenAI
const models = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [preferences, setPreferences] = useState<Record<number, UserPreference>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewUserOpen, setViewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Example mock data - replace with actual API call
  const mockUsers: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      is_active: true,
      is_verified: true,
      is_admin: true,
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-05-01T09:30:00Z'
    },
    {
      id: 2,
      email: 'creator_manager@example.com',
      is_active: true,
      is_verified: true,
      is_admin: false,
      created_at: '2025-02-10T14:30:00Z',
      updated_at: '2025-04-20T15:45:00Z'
    },
    {
      id: 3,
      email: 'api_user@example.com',
      is_active: true,
      is_verified: true,
      is_admin: false,
      created_at: '2025-03-05T11:20:00Z',
      updated_at: '2025-04-15T10:10:00Z'
    },
    {
      id: 4,
      email: 'inactive@example.com',
      is_active: false,
      is_verified: false,
      is_admin: false,
      created_at: '2025-03-20T16:40:00Z',
      updated_at: '2025-04-10T08:15:00Z'
    }
  ];

  const mockPreferences: Record<number, UserPreference> = {
    1: {
      id: 1,
      user_id: 1,
      openai_api_key: 'sk-123456789abcdefghij123456789abcdefghij1234',
      default_model: 'gpt-4',
      suggestion_count: 3,
      selected_creators: [1, 2, 3]
    },
    2: {
      id: 2,
      user_id: 2,
      openai_api_key: null,
      default_model: 'gpt-4-turbo',
      suggestion_count: 5,
      selected_creators: [1, 2]
    },
    3: {
      id: 3,
      user_id: 3,
      openai_api_key: 'sk-abcdefghij123456789abcdefghij123456789abcd',
      default_model: 'gpt-3.5-turbo',
      suggestion_count: 3,
      selected_creators: null
    },
    4: {
      id: 4,
      user_id: 4,
      openai_api_key: null,
      default_model: 'gpt-4',
      suggestion_count: 3,
      selected_creators: null
    }
  };

  // Form for creating users
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      is_admin: false,
      openai_api_key: null,
      default_model: 'gpt-4',
      suggestion_count: 3,
    } as CreateUserFormValues, // Add type assertion
  });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, you would fetch from the API
        const response = await apiClient.get('/users');
        setUsers(response);
        
        // Using mock data for now
        setUsers(mockUsers);
        setPreferences(mockPreferences);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get users for current page
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Open create user dialog
  const handleCreateUser = () => {
    reset({
      email: '',
      is_admin: false,
      openai_api_key: null,
      default_model: 'gpt-4',
      suggestion_count: 3,
    });
    setDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Open reset password dialog
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  // Open view user dialog
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewUserOpen(true);
  };

  // Handle form submission for create user
  const onSubmit = async (data: CreateUserFormValues) => {
    setError(null);
    setSuccess(null);
    
    try {
      // In a real app, you would add via the API
      const response = await apiClient.post('/users', data);
      
      // For now, just simulate a successful addition
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Add to local state with a mock ID
      const newUser: User = {
        id: Math.max(0, ...users.map(u => u.id)) + 1,
        email: data.email,
        is_active: true,
        is_verified: false,
        is_admin: data.is_admin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Create mock preferences
      const newPreference: UserPreference = {
        id: newUser.id,
        user_id: newUser.id,
        openai_api_key: data.openai_api_key,
        default_model: data.default_model,
        suggestion_count: data.suggestion_count,
        selected_creators: null,
      };
      
      setUsers([...users, newUser]);
      setPreferences({ ...preferences, [newUser.id]: newPreference });
      setSuccess('User created successfully. An email has been sent to the user for account setup.');
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
    }
  };

  // Handle user status toggle
  const handleStatusToggle = async (user: User) => {
    try {
      // In a real app, you would update via the API
      // await apiClient.patch(`/users/${user.id}`, { is_active: !user.is_active });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === user.id 
          ? { ...u, is_active: !u.is_active } 
          : u
      ));
      
      setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.message || 'Failed to update user status');
    }
  };

  // Handle admin role toggle
  const handleAdminToggle = async (user: User) => {
    try {
      // In a real app, you would update via the API
      // await apiClient.patch(`/users/${user.id}`, { is_admin: !user.is_admin });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === user.id 
          ? { ...u, is_admin: !u.is_admin } 
          : u
      ));
      
      setSuccess(`User ${user.is_admin ? 'removed from' : 'added to'} admin role successfully`);
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Failed to update user role');
    }
  };

  // Handle password reset confirmation
  const handleResetPasswordConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      // In a real app, you would call the API to reset password
      // await apiClient.post(`/users/${selectedUser.id}/reset-password`);
      
      // For now, just simulate a successful reset
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccess('Password reset email sent successfully');
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset password');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      // In a real app, you would delete via the API
      // await apiClient.delete(`/users/${selectedUser.id}`);
      
      // Update local state
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      setSuccess('User deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Mask API key for display
  const maskApiKey = (key: string | null) => {
    if (!key) return '—';
    
    if (showApiKey) {
      return key;
    }
    
    const prefix = key.slice(0, 7);
    const suffix = key.slice(-4);
    const maskedPart = '•'.repeat(10);
    return `${prefix}...${maskedPart}...${suffix}`;
  };

  return (
    <Box>
      {/* Success message */}
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
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Users
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage user accounts and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateUser}
        >
          Add User
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {/* Search field */}
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
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No users found.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateUser}
              sx={{ mt: 2 }}
            >
              Add Your First User
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell align="center"><strong>Role</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell><strong>Created</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: user.is_admin ? 'primary.main' : 'grey.400', width: 32, height: 32 }}>
                            {user.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">
                            {user.email}
                          </Typography>
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
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(user.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => handleViewUser(user)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton
                            size="small"
                            onClick={() => handleResetPassword(user)}
                          >
                            <KeyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.is_active ? "Deactivate" : "Activate"}>
                          <IconButton
                            size="small"
                            color={user.is_active ? "warning" : "success"}
                            onClick={() => handleStatusToggle(user)}
                          >
                            <Switch
                              checked={user.is_active}
                              size="small"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Create User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create a new user account. An email will be sent to the user with instructions to set up their password.
            </Typography>
            
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  autoComplete="email"
                />
              )}
            />
            
            <FormControlLabel
              control={
                <Controller
                  name="is_admin"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label="Admin Privileges"
              sx={{ mt: 2 }}
            />
            
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Default Settings
            </Typography>
            
            <Controller
              name="openai_api_key"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="OpenAI API Key (Optional)"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!errors.openai_api_key}
                  helperText={errors.openai_api_key?.message || "If not provided, the system will use the default API key"}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              )}
            />
            
            <Controller
              name="default_model"
              control={control}
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
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Suggestion Count"
                  type="number"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!errors.suggestion_count}
                  helperText={errors.suggestion_count?.message || "Number of suggestions to generate (1-10)"}
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
      
      {/* View User Dialog - FIXED: Updated Grid usage to Material-UI v7 syntax */}
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
                        <Chip 
                          label={selectedUser.is_admin ? "Admin" : "User"} 
                          color={selectedUser.is_admin ? "primary" : "default"}
                          size="small"
                          icon={selectedUser.is_admin ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                          sx={{ fontWeight: 500, mt: 1 }}
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">
                      Email Verified
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedUser.is_verified ? "Yes" : "No"}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formatDate(selectedUser.created_at)}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedUser.updated_at)}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                      Preferences
                    </Typography>
                    
                    {selectedUser && preferences[selectedUser.id] && (
                      <>
                        <Typography variant="subtitle2" color="text.secondary">
                          OpenAI API Key
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                            {maskApiKey(preferences[selectedUser.id].openai_api_key)}
                          </Typography>
                          <IconButton size="small" onClick={() => setShowApiKey(!showApiKey)}>
                            {showApiKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                        
                        <Typography variant="subtitle2" color="text.secondary">
                          Default Model
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {preferences[selectedUser.id]?.default_model}
                        </Typography>
                        
                        <Typography variant="subtitle2" color="text.secondary">
                          Suggestion Count
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {preferences[selectedUser.id]?.suggestion_count}
                        </Typography>
                        
                        <Typography variant="subtitle2" color="text.secondary">
                          Selected Creators
                        </Typography>
                        <Typography variant="body1">
                          {preferences[selectedUser.id]?.selected_creators 
                            ? `${preferences[selectedUser.id]?.selected_creators?.length || 0} creators selected`
                            : "No creators selected"}
                        </Typography>
                      </>
                    )}
                    
                    {!preferences[selectedUser.id] && (
                      <Typography variant="body1" color="text.secondary">
                        No preferences set for this user.
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                <Grid size={12}>
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<KeyIcon />}
                      onClick={() => {
                        setViewUserOpen(false);
                        setResetPasswordDialogOpen(true);
                      }}
                    >
                      Reset Password
                    </Button>
                    
                    <Button
                      variant={selectedUser.is_active ? "outlined" : "contained"}
                      color={selectedUser.is_active ? "warning" : "success"}
                      onClick={() => {
                        handleStatusToggle(selectedUser);
                        setViewUserOpen(false);
                      }}
                    >
                      {selectedUser.is_active ? "Deactivate User" : "Activate User"}
                    </Button>
                    
                    <Button
                      variant={selectedUser.is_admin ? "outlined" : "contained"}
                      color="primary"
                      onClick={() => {
                        handleAdminToggle(selectedUser);
                        setViewUserOpen(false);
                      }}
                    >
                      {selectedUser.is_admin ? "Remove Admin Role" : "Make Admin"}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        setViewUserOpen(false);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Delete User
                    </Button>
                  </Box>
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
        <DialogContent>
          <DialogContentText>
            {selectedUser && (
              <>
                Are you sure you want to reset the password for <strong>{selectedUser.email}</strong>?
                <br /><br />
                A password reset link will be sent to the user's email address.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleResetPasswordConfirm}
            variant="contained"
          >
            Reset Password
          </Button>
        </DialogActions>
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
                Are you sure you want to delete the user <strong>{selectedUser.email}</strong>?
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
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}