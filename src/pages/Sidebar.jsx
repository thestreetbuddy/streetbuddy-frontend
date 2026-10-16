import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Building2,
  Shapes,
  MapPin,
  Users,
  Activity,
  UserCircle,
  ChevronDown,
} from 'lucide-react';

import '../styles/sidebar.css';

function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();

  const isExploreActive =
    location.pathname.startsWith('/cities') ||
    location.pathname.startsWith('/categories') ||
    location.pathname.startsWith('/places');

  const [exploreOpen, setExploreOpen] = useState(isExploreActive);

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="brand-mark">SB</span>
        <span>Street Buddy</span>
      </div>

      <nav className="sidebar-nav">

        <NavLink to="/dashboard" onClick={closeSidebar}>
          <span className="nav-icon">
            <LayoutDashboard size={20} />
          </span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/users" onClick={closeSidebar}>
          <span className="nav-icon">
            <Users size={20} />
          </span>
          <span>Users</span>
        </NavLink>

        <NavLink to="/user-activity" onClick={closeSidebar}>
          <span className="nav-icon">
            <Activity size={20} />
          </span>
          <span>User Activity</span>
        </NavLink>

        <button
          className={`explore-btn ${isExploreActive ? 'active' : ''}`}
          onClick={() => setExploreOpen(!exploreOpen)}
        >
          <div className="explore-left">
            <span className="nav-icon">
              <Compass size={20} />
            </span>
            <span>Explore</span>
          </div>

          <ChevronDown
            size={18}
            className={exploreOpen ? 'rotate' : ''}
          />
        </button>

        {exploreOpen && (
          <div className="submenu">

            <NavLink
              to="/cities"
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? 'submenu-link active' : 'submenu-link'
              }
            >
              <Building2 size={18} />
              <span>Cities</span>
            </NavLink>

            <NavLink
              to="/categories"
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? 'submenu-link active' : 'submenu-link'
              }
            >
              <Shapes size={18} />
              <span>Categories</span>
            </NavLink>

            <NavLink
              to="/places"
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? 'submenu-link active' : 'submenu-link'
              }
            >
              <MapPin size={18} />
              <span>Places</span>
            </NavLink>

          </div>
        )}

        <NavLink to="/admin-profile" onClick={closeSidebar}>
          <span className="nav-icon">
            <UserCircle size={20} />
          </span>
          <span>Admin Profile</span>
        </NavLink>

      </nav>
    </aside>
  );
}

export default Sidebar;