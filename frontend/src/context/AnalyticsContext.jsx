import { createContext, useState, useContext, useEffect } from 'react';
import { getAnalyticsDashboard } from '../services/api';
import { useAuth } from './AuthContext';

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const { user } = useAuth();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await getAnalyticsDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user, timeRange]);

  return (
    <AnalyticsContext.Provider value={{
      dashboard,
      loading,
      timeRange,
      setTimeRange,
      fetchDashboard
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};