import React, { createContext, useState, useEffect } from 'react';

// 1. Create the context
const ThemeContext = createContext();

// 2. Create the provider (the component that will wrap our app)
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default theme is light

  // 3. This function will be used by our button to toggle the theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // 4. This effect adds the theme name as a class to the <body>
  // This is how our CSS will work!
  useEffect(() => {
    document.body.className = ''; // Clear old theme
    document.body.classList.add(theme); // Add the new one (e.g., 'dark' or 'light')
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;