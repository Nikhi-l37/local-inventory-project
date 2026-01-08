import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './App.module.css';
import ThemeToggle from './components/ThemeToggle.jsx';
import Logo from './components/Logo.jsx';

const LogoutButton = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
    window.location.reload();
  };
  return (
    <button onClick={handleLogout} className={styles.logoutButton}>
      Logout
    </button>
  );
};

function App() {
  const location = useLocation();
  const path = location.pathname;

  const isSellerPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/dashboard');
  const isLoggedIn = !!localStorage.getItem('token');

  // NEW: Check if we are on the search page
  const isSearchPage = path === '/search';

  return (
    // NO more extra div here. #root handles the flex column
    <>
      {/* Render navbar ONLY if not on search page */}
      {!isSearchPage && (
        <nav className={styles.navbar}>
          <div style={{ color: 'white' }}>
            <Logo />
          </div>

          <div className={styles.navLinks}>
            {isLoggedIn ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <LogoutButton />
              </>
            ) : (
              isSellerPage ? (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/register">Register</Link>
                </>
              ) : (
                <>
                  <Link to="/search">Search</Link>
                  <Link to="/login">Seller Portal</Link>
                </>
              )
            )}
          </div>

          <ThemeToggle />
        </nav>
      )}

      {/* The main content area. This will fill remaining space */}
      {/* We now apply content styles directly here, or not at all for full-screen map */}
      <div className={(isSearchPage || path.startsWith('/dashboard')) ? styles.fullPageContent : styles.regularContent}>
        <Outlet />
      </div>
    </>
  );
}

export default App;