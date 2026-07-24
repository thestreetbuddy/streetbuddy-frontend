import { useEffect, useState } from 'react';
import { getDashboardStats } from '../api/adminApi';
import { 
  Users, 
  Activity, 
  Calendar, 
  CalendarDays, 
  FileText, 
  Star, 
  MapPin 
} from 'lucide-react';
import '../styles/dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsersToday: 0,
    activeUsersWeekly: 0,
    activeUsersMonthly: 0,
    totalPosts: 0,
    totalReviews: 0,
    pendingPlaces: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await getDashboardStats();
        
        // Nested data aayega backend se, isliye optional chaining lagayi hai
        const dashData = response.data?.data?.data || {};

        setStats({
          totalUsers: dashData.totalUsers || 0,
          activeUsersToday: dashData.activeUsersToday || 0,
          activeUsersWeekly: dashData.activeUsersWeekly || 0,
          activeUsersMonthly: dashData.activeUsersMonthly || 0,
          totalPosts: dashData.totalPosts || 0,
          totalReviews: dashData.totalReviews || 0,
          pendingPlaces: dashData.pendingPlaces || 0,
        });
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Unable to load dashboard statistics.');
      }
    };

    loadStats();
  }, []);

  return (
    <section>
      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card card-blue">
          <div className="icon-wrapper">
            <Users />
          </div>
          <div className="stat-info">
            <span>Total Users</span>
            <strong>{stats.totalUsers}</strong>
          </div>
        </div>

        <div className="stat-card card-green">
          <div className="icon-wrapper">
            <Activity />
          </div>
          <div className="stat-info">
            <span>Active Today</span>
            <strong>{stats.activeUsersToday}</strong>
          </div>
        </div>

        <div className="stat-card card-purple">
          <div className="icon-wrapper">
            <Calendar />
          </div>
          <div className="stat-info">
            <span>Active Weekly</span>
            <strong>{stats.activeUsersWeekly}</strong>
          </div>
        </div>

        <div className="stat-card card-indigo">
          <div className="icon-wrapper">
            <CalendarDays />
          </div>
          <div className="stat-info">
            <span>Active Monthly</span>
            <strong>{stats.activeUsersMonthly}</strong>
          </div>
        </div>

        <div className="stat-card card-orange">
          <div className="icon-wrapper">
            <FileText />
          </div>
          <div className="stat-info">
            <span>Total Posts</span>
            <strong>{stats.totalPosts}</strong>
          </div>
        </div>

        <div className="stat-card card-yellow">
          <div className="icon-wrapper">
            <Star />
          </div>
          <div className="stat-info">
            <span>Total Reviews</span>
            <strong>{stats.totalReviews}</strong>
          </div>
        </div>

        <div className="stat-card card-red">
          <div className="icon-wrapper">
            <MapPin />
          </div>
          <div className="stat-info">
            <span>Pending Places</span>
            <strong>{stats.pendingPlaces}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
