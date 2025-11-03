// nikhi-l37/local-inventory-project/local-inventory-project-311337e0354f330c870cbcf8e0b43f1dfb388258/client/src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect } from 'react';

// 1. Create the context
const ThemeContext = createContext();

// 2. Create the provider (the component that will wrap our app)
export const ThemeProvider = ({ children }) => {
  // FIXED: Default theme is now the new 'screen-coach-theme'
  const [theme, setTheme] = useState('screen-coach-theme'); 

  // 3. This function will be used by our button to toggle the theme
  const toggleTheme = () => {
    // FIXED: Cycle through all three themes: screen-coach-theme -> light -> dark
    setTheme((prevTheme) => {
      if (prevTheme === 'screen-coach-theme') return 'light';
      if (prevTheme === 'light') return 'dark';
      return 'screen-coach-theme';
    });
  };

  // 4. This effect adds the theme name as a class to the <body>
  useEffect(() => {
    document.body.className = ''; 
    // FIXED: Use the new class name 'screen-coach-theme'
    document.body.classList.add(theme === 'screen-coach-theme' ? 'screen-coach-theme' : theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;