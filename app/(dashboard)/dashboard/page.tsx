// app/(dashboard)/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ChatIcon from '@mui/icons-material/Chat';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../../lib/api';

// Mock data - replace with actual API calls
const mockStats = {
  totalCreators: 12,
  totalStyleExamples: 324,
  totalResponseExamples: 186,
  apiRequests: 2845,
  successRate: 98.5,
};

const mockUsageData = [
  { date: 'Mon', requests: 140 },
  { date: 'Tue', requests: 210 },
  { date: 'Wed', requests: 320 },
  { date: 'Thu', requests: 280 },
  { date: 'Fri', requests: 410 },
  { date: 'Sat', requests: 180 },
  { date: 'Sun', requests: 160 },
];

const mockCreators = [
  { id: 1, name: 'John Doe', requests: 750, responseRate: 97.8 },
  { id: 2, name: 'Jane Smith', requests: 620, responseRate: 99.2 },
  { id: 3, name: 'Bob Johnson', requests: 480, responseRate: 95.5 },
  { id: 4, name: 'Sara Williams', requests: 410, responseRate: 98.1 },
  { id: 5, name: 'Mike Thompson', requests: 380, responseRate: 96.7 },
];

const mockActivity = [
  { id: 1, action: 'Created new creator', user: 'admin@example.com', time: '10 minutes ago' },
  { id: 2, action: 'Added style examples', user: 'editor@example.com', time: '1 hour ago' },
  { id: 3, action: 'Updated creator settings', user: 'admin@example.com', time: '3 hours ago' },
  { id: 4, action: 'Generated suggestions', user: 'API request', time: '4 hours ago' },
  { id: 5, action: 'Added new user', user: 'admin@example.com', time: '1 day ago' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(mockStats);
  const [usageData, setUsageData] = useState(mockUsageData);
  const [creators, setCreators] = useState(mockCreators);
  const [activity, setActivity] = useState(mockActivity);
  const [loading, setLoading] = useState(false);

  // Fetch real data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // These would be replaced with actual API calls
        // const stats = await apiClient.get('/suggestions/stats');
        // setStats(stats);
        
        // For now, we'll use the mock data
        setStats(mockStats);
        setUsageData(mockUsageData);
        setCreators(mockCreators);
        setActivity(mockActivity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to the FanFix ChatAssist admin dashboard. View stats and manage your creators.
      </Typography>
      
      {/* FIXED: Stats Cards - Updated Grid usage to Material-UI v7 syntax */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  Total Creators
                </Typography>
                <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: '50%' }}>
                  <PeopleIcon color="primary" />
                </Box>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.totalCreators}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  Total Examples
                </Typography>
                <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: '50%' }}>
                  <ChatIcon color="primary" />
                </Box>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.totalStyleExamples + stats.totalResponseExamples}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalStyleExamples} style / {stats.totalResponseExamples} response
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  API Requests
                </Typography>
                <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: '50%' }}>
                  <AutoAwesomeIcon color="primary" />
                </Box>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.apiRequests.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Past 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2">
                  Success Rate
                </Typography>
                <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: '50%' }}>
                  <CheckCircleIcon color="primary" />
                </Box>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.successRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                API responses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Chart */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          API Usage (Last 7 Days)
        </Typography>
        <Box sx={{ height: 300, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={usageData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="requests" fill="#d2b3e2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
      
      {/* FIXED: Bottom section - Updated Grid usage to Material-UI v7 syntax */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              {activity.map((item, index) => (
                <Box key={item.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {item.action}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.user}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.time}
                    </Typography>
                  </Box>
                  {index < activity.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        
        {/* Top Creators */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Top Creators
            </Typography>
            <Box sx={{ mt: 2 }}>
              {creators.map((creator, index) => (
                <Box key={creator.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {creator.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {creator.requests.toLocaleString()} requests
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {creator.responseRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        success rate
                      </Typography>
                    </Box>
                  </Box>
                  {index < creators.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}