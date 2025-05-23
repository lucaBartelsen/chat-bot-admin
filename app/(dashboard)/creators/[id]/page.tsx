// app/(dashboard)/creators/[id]/page.tsx - Fixed with React.use()

'use client';

import { useState, useEffect, SyntheticEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Button, 
  Paper, 
  Chip, 
  Avatar, 
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Link from 'next/link';
import { apiClient } from '../../../../lib/api';

// Component imports
import BasicInfoTab from '../../../../components/creators/BasicInfoTab';
import StyleConfigTab from '../../../../components/creators/StyleConfigTab';
import StyleExamplesTab from '../../../../components/creators/StyleExamplesTab';
import ResponseExamplesTab from '../../../../components/creators/ResponseExamplesTab';
import AnalyticsTab from '../../../../components/creators/AnalyticsTab';

// Creator interface
interface Creator {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Creator style interface
interface CreatorStyle {
  id: number;
  creator_id: number;
  approved_emojis: string[] | null;
  case_style: string | null;
  text_replacements: Record<string, string> | null;
  sentence_separators: string[] | null;
  punctuation_rules: Record<string, any> | null;
  common_abbreviations: Record<string, string> | null;
  message_length_preferences: Record<string, number> | null;
  style_instructions: string | null;
  tone_range: string[] | null;
  created_at: string;
  updated_at: string;
}

// Tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`creator-tabpanel-${index}`}
      aria-labelledby={`creator-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Get props for tab accessibility
function a11yProps(index: number) {
  return {
    id: `creator-tab-${index}`,
    'aria-controls': `creator-tabpanel-${index}`,
  };
}

// Creator detail page component
export default function CreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // FIXED: Unwrap params using React.use()
  const resolvedParams = use(params);
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [creatorStyle, setCreatorStyle] = useState<CreatorStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch creator data from API
  useEffect(() => {
    const fetchCreatorData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // FIXED: Use resolvedParams.id instead of params.id
        const creatorData = await apiClient.get<Creator>(`/creators/${resolvedParams.id}`);
        setCreator(creatorData);
        
        try {
          // Fetch creator style (this might not exist yet for new creators)
          const styleData = await apiClient.get<CreatorStyle>(`/creators/${resolvedParams.id}/style`);
          setCreatorStyle(styleData);
        } catch (styleError: any) {
          // If 404, it means the style doesn't exist yet - this is normal
          if (styleError.response?.status !== 404) {
            console.error('Error fetching creator style:', styleError);
          }
          setCreatorStyle(null);
        }
      } catch (error: any) {
        console.error('Error fetching creator:', error);
        setError(error.response?.data?.detail || error.message || 'Failed to load creator data');
      } finally {
        setLoading(false);
      }
    };

    // FIXED: Use resolvedParams.id instead of params.id
    if (resolvedParams.id) {
      fetchCreatorData();
    }
  }, [resolvedParams.id]); // FIXED: Updated dependency array

  // Handle tab change
  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle active status toggle
  const handleStatusToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!creator) return;
    
    try {
      const newStatus = event.target.checked;
      // Call API to update creator status
      await apiClient.patch(`/creators/${creator.id}`, { is_active: newStatus });
      
      // Update local state
      setCreator({ ...creator, is_active: newStatus });
      setSuccess(`Creator ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error updating creator status:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to update status');
    }
  };

  // Handle edit click
  const handleEditClick = () => {
    // FIXED: Use resolvedParams.id instead of params.id
    router.push(`/creators/${resolvedParams.id}/edit`);
  };

  // Return loading state or error
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !creator) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error || 'Creator not found'}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/creators')}
          sx={{ mt: 2 }}
        >
          Back to Creators
        </Button>
      </Box>
    );
  }

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
      
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/dashboard" color="inherit" underline="hover">
          Dashboard
        </MuiLink>
        <MuiLink component={Link} href="/creators" color="inherit" underline="hover">
          Creators
        </MuiLink>
        <Typography color="text.primary">{creator.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(to right, #d2b3e2, #e6d7ef)`,
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Back button */}
          <IconButton
            onClick={() => router.push('/creators')}
            sx={{ mr: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.default' } }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          {/* Avatar */}
          <Avatar
            sx={{ 
              width: 80, 
              height: 80,
              bgcolor: 'background.paper',
              color: 'primary.main',
              fontSize: '2rem',
              mr: 3,
            }}
            src={creator.avatar_url || undefined}
          >
            {creator.name.charAt(0).toUpperCase()}
          </Avatar>
          
          {/* Creator info */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" color="white">
              {creator.name}
            </Typography>
            
            <Typography variant="body1" color="white" sx={{ opacity: 0.9, maxWidth: 600 }}>
              {creator.description || 'No description provided.'}
            </Typography>
          </Box>
          
          {/* Actions */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={creator.is_active}
                  onChange={handleStatusToggle}
                  color="primary"
                />
              }
              label={creator.is_active ? 'Active' : 'Inactive'}
              sx={{ 
                bgcolor: 'background.paper',
                px: 1,
                borderRadius: 2,
                '& .MuiFormControlLabel-label': {
                  color: creator.is_active ? 'success.main' : 'text.secondary',
                  fontWeight: 500,
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditClick}
              sx={{ 
                bgcolor: 'background.paper', 
                color: 'primary.main',
                '&:hover': { bgcolor: 'background.default' } 
              }}
            >
              Edit
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabs navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="creator detail tabs"
        >
          <Tab 
            label="Basic Info" 
            icon={<InfoIcon />} 
            iconPosition="start" 
            {...a11yProps(0)} 
          />
          <Tab 
            label="Style Config" 
            icon={<SettingsIcon />} 
            iconPosition="start" 
            {...a11yProps(1)} 
          />
          <Tab 
            label="Style Examples" 
            icon={<ChatIcon />} 
            iconPosition="start" 
            {...a11yProps(2)} 
          />
          <Tab 
            label="Response Examples" 
            icon={<FormatListBulletedIcon />} 
            iconPosition="start" 
            {...a11yProps(3)} 
          />
          <Tab 
            label="Analytics" 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            {...a11yProps(4)} 
          />
        </Tabs>
      </Box>

      {/* Tab panels */}
      <TabPanel value={tabValue} index={0}>
        <BasicInfoTab 
          creator={creator} 
          setCreator={setCreator} 
          setSuccess={setSuccess} 
          setError={setError} 
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <StyleConfigTab 
          creatorStyle={creatorStyle} 
          creatorId={creator.id} 
          setCreatorStyle={setCreatorStyle}
          setSuccess={setSuccess}
          setError={setError}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <StyleExamplesTab creatorId={creator.id} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <ResponseExamplesTab creatorId={creator.id} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={4}>
        <AnalyticsTab creatorId={creator.id} creatorName={creator.name} />
      </TabPanel>
    </Box>
  );
}