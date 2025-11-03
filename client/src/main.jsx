import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx'; 

import './index.css';
import App from './App.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx'; 
import ProtectedRoute from './ProtectedRoute.jsx'; 
import Home from './pages/Home.jsx'; // This is our map page
import Landing from './pages/Landing.jsx'; // <--- 1. IMPORT NEW PAGE

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { 
        path: '/', // <--- 2. UPDATE HOME PATH
        element: <Landing />, // <--- 3. USE LANDING COMPONENT
      },
      { 
        path: '/search', // <--- 4. CREATE SEARCH PATH
        element: <Home />, // <--- 5. USE MAP COMPONENT HERE
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      { 
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

// ... (rest of the file is the same)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);