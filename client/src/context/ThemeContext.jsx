// nikhi-l37/local-inventory-project/local-inventory-project-f0f0822a6b291101934f3b97e9387c78182115ad/client/src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect } from 'react';

// 1. Create the context
const ThemeContext = createContext();

// 2. Create the provider (the component that will wrap our app)
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default theme is now 'light' (white-blue)

  // 3. This function will be used by our button to toggle the theme
  const toggleTheme = () => {
    // Toggle between light and dark themes only
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // 4. This effect adds the theme name as a class to the <body>
  useEffect(() => {
    document.body.className = ''; 
    document.body.classList.add(theme); 
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;