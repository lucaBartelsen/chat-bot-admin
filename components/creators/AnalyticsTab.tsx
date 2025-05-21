// components/creators/AnalyticsTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import { apiClient } from '../../lib/api';

// Analytics data interfaces
interface ApiUsageStats {
  daily: { date: string; requests: number }[];
  weekly: { date: string; requests: number }[];
  monthly: { date: string; requests: number }[];
}

interface CategoryStats {
  category: string;
  count: number;
}

interface ResponseStats {
  total_requests: number;
  success_rate: number;
  average_response_time: number;
  top_fan_messages: { message: string; count: number }[];
  category_distribution: CategoryStats[];
  monthly_trends: { month: string; requests: number }[];
}

// Props for analytics tab
interface AnalyticsTabProps {
  creatorId: number;
  creatorName: string;
}

// Time period options
type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function AnalyticsTab({ creatorId, creatorName }: AnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [apiUsageStats, setApiUsageStats] = useState<ApiUsageStats | null>(null);
  const [responseStats, setResponseStats] = useState<ResponseStats | null>(null);

  // COLORS
  const COLORS = ['#d2b3e2', '#b08ebf', '#9c64b3', '#7a4d8c', '#e6d7ef'];

  // Example mock data - replace with actual API call
  const mockApiUsageStats: ApiUsageStats = {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2025, 4, i + 1).toISOString().split('T')[0],
      requests: Math.floor(Math.random() * 300) + 100,
    })),
    weekly: Array.from({ length: 12 }, (_, i) => ({
      date: `Week ${i + 1}`,
      requests: Math.floor(Math.random() * 1200) + 800,
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }),
      requests: Math.floor(Math.random() * 5000) + 3000,
    })),
  };

  const mockResponseStats: ResponseStats = {
    total_requests: 24752,
    success_rate: 97.8,
    average_response_time: 0.87,
    top_fan_messages: [
      { message: "Hey, how are you?", count: 432 },
      { message: "I love your content!", count: 287 },
      { message: "What's your favorite...?", count: 203 },
      { message: "Can you recommend...?", count: 178 },
      { message: "When will you post more...?", count: 156 },
    ],
    category_distribution: [
      { category: "Greeting", count: 35 },
      { category: "Question", count: 28 },
      { category: "Compliment", count: 15 },
      { category: "Request", count: 10 },
      { category: "Other", count: 12 },
    ],
    monthly_trends: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i, 1).toLocaleString('default', { month: 'short' }),
      requests: Math.floor(Math.random() * 3000) + 1500,
    })),
  };

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, you would fetch from the API
        const usage = await apiClient.get(`/creators/${creatorId}/analytics/usage?period=${timePeriod}`);
        const responses = await apiClient.get(`/creators/${creatorId}/analytics/responses?period=${timePeriod}`);
        setApiUsageStats(usage);
        setResponseStats(responses);
        
        // Using mock data for now
        setApiUsageStats(mockApiUsageStats);
        setResponseStats(mockResponseStats);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [creatorId, timePeriod]);

  // Get appropriate data for the selected time period
  const getTimeSeriesData = () => {
    if (!apiUsageStats) return [];
    
    switch (timePeriod) {
      case 'day':
        return apiUsageStats.daily.slice(-30);
      case 'week':
        return apiUsageStats.weekly.slice(-12);
      case 'month':
        return apiUsageStats.monthly;
      case 'year':
        return apiUsageStats.monthly;
      default:
        return apiUsageStats.monthly;
    }
  };

  // Handle export analytics data
  const handleExport = async () => {
    try {
      // In a real app, you would GET the data from the API
      const response = await apiClient.get(`/creators/${creatorId}/analytics/export?period=${timePeriod}`, {
         responseType: 'blob',
      });
      
      // Create JSON content manually for mock
      const data = {
        creator: {
          id: creatorId,
          name: creatorName,
        },
        time_period: timePeriod,
        api_usage: getTimeSeriesData(),
        response_stats: responseStats,
        export_date: new Date().toISOString(),
      };
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `creator_${creatorId}_analytics_${timePeriod}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error exporting analytics data:', err);
      setError(err.message || 'Failed to export analytics data');
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Analytics & Performance
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="time-period-label">Time Period</InputLabel>
            <Select
              labelId="time-period-label"
              id="time-period"
              value={timePeriod}
              label="Time Period"
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            >
              <MenuItem value="day">Daily</MenuItem>
              <MenuItem value="week">Weekly</MenuItem>
              <MenuItem value="month">Monthly</MenuItem>
              <MenuItem value="year">Yearly</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Data
          </Button>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total API Requests
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {responseStats?.total_requests.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Success Rate
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {responseStats?.success_rate || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Avg. Response Time
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {responseStats?.average_response_time || 0}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* API Usage Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                API Usage Over Time
              </Typography>
              
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getTimeSeriesData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#d2b3e2" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 8 }} 
                      name="API Requests"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          {/* Category Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Category Distribution
              </Typography>
              
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={responseStats?.category_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {responseStats?.category_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} examples`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          {/* Top Fan Messages */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Top Fan Messages
              </Typography>
              
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={responseStats?.top_fan_messages}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="message" 
                      tick={{ fontSize: 12 }}
                      width={150}
                      tickFormatter={(value) => 
                        value.length > 20 ? `${value.substring(0, 20)}...` : value
                      }
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} occurrences`, 'Count']}
                      labelFormatter={(label) => `Message: ${label}`}
                    />
                    <Bar dataKey="count" fill="#d2b3e2" name="Occurrences" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          {/* Monthly Trends */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Trends
              </Typography>
              
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={responseStats?.monthly_trends}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requests" fill="#9c64b3" name="API Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          {/* Usage Recommendations */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Optimization Recommendations
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body1" paragraph>
                Based on your usage patterns, here are some suggestions to optimize performance:
              </Typography>
              
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li>Consider adding more examples in the "Question" category as it's frequently used.</li>
                <li>Response quality is high, with a {responseStats?.success_rate}% success rate.</li>
                <li>Average response time is good at {responseStats?.average_response_time}s.</li>
                <li>Add more diverse response examples for greeting messages to improve variety.</li>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}