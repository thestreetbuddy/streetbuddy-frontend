import { useState } from 'react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import '../styles/layout.css';

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((currentValue) => !currentValue);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

      {isSidebarOpen && <button className="sidebar-backdrop" type="button" onClick={closeSidebar} />}

      <div className="admin-main">
        <Header toggleSidebar={toggleSidebar} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
