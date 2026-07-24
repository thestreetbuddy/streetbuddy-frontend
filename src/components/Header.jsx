import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogoutIcon, UserIcon } from './AdminIcons.jsx';
import '../styles/header.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/cities': 'Cities',
  '/categories': 'Categories',
  '/places': 'Places',
  '/users': 'Users',
  '/admin-profile': 'Admin Profile',
};

function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Admin Panel';
  const [adminProfile, setAdminProfile] = useState({
    name: 'Admin',
    email: 'admin@example.com',
    profile_image: '',
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem('adminProfile');

    if (savedProfile) {
      try {
        setAdminProfile(JSON.parse(savedProfile));
      } catch {
        localStorage.removeItem('adminProfile');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-button" type="button" onClick={toggleSidebar}>
          Menu
        </button>
        <h1>{title}</h1>
      </div>

      <div className="header-right">
        <button className="profile-button" type="button" onClick={() => navigate('/admin-profile')}>
          <span className="profile-avatar">
            {adminProfile.profile_image ? <img src={adminProfile.profile_image} alt="Admin" /> : <UserIcon />}
          </span>
          <span className="profile-text">
            <strong>{adminProfile.name}</strong>
            <small>{adminProfile.email}</small>
          </span>
        </button>

        <button className="logout-icon-button" type="button" onClick={handleLogout} title="Logout">
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
}

export default Header;
