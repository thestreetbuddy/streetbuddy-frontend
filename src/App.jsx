import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Cities from './pages/Cities.jsx';
import Categories from './pages/Categories.jsx';
import Places from './pages/Places.jsx';
import Users from './pages/Users.jsx';
import EditCategory from './pages/EditCategory.jsx';
import EditCity from './pages/EditCity.jsx';
import AdminProfile from './pages/AdminProfile.jsx';
import UserActivity from './pages/UserActivity.jsx';

// A wrapper for routes that require authentication and layout
function MainLayout() {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they
    // log in, which is a nicer user experience than dropping them off on the
    // homepage.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cities" element={<Cities />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/users" element={<Users />} />
        <Route path="/user-activity" element={<UserActivity />} />
        <Route path="/analytics/activity" element={<Navigate to="/user-activity" replace />} />
        <Route path="/cities/edit/:id" element={<EditCity />} />
        <Route path="/categories/edit/:id" element={<EditCategory />} />
        <Route path="/places" element={<Places />} />
        <Route path="/admin-profile" element={<AdminProfile />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Add a catch-all for any other routes inside the layout */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  const [isApiLoading, setIsApiLoading] = useState(false);

  useEffect(() => {
    const showLoader = () => setIsApiLoading(true);
    const hideLoader = () => setIsApiLoading(false);

    window.addEventListener('show-global-loader', showLoader);
    window.addEventListener('hide-global-loader', hideLoader);

    return () => {
      window.removeEventListener('show-global-loader', showLoader);
      window.removeEventListener('hide-global-loader', hideLoader);
    };
  }, []);

  return (
    <>
      {isApiLoading && (
        <div className="global-loader-overlay">
          <div className="sb-spinner">SB</div>
        </div>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </>
  );
}

export default App;
