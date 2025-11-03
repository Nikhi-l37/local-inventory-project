import React, { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

// Simple style for the button, you can customize it
const buttonStyle = {
  background: '#f0f0f0',
  border: '1px solid #ccc',
  borderRadius: '5px',
  padding: '5px 10px',
  cursor: 'pointer',
  fontSize: '16px',
};

// nikhi-l37/local-inventory-project/local-inventory-project-311337e0354f330c870cbcf8e0b43f1dfb388258/client/src/components/ThemeToggle.jsx

// ... (imports and buttonStyle)

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Helper to determine the correct icon based on the three themes
  const getIcon = () => {
    if (theme === 'light') return '☀️'; // Sun for light
    if (theme === 'dark') return '🌙'; // Moon for dark
    return '🛡️'; // Shield or something unique for ScreenCoach theme
  };

  return (
    <button onClick={toggleTheme} style={buttonStyle}>
      {getIcon()}
    </button>
  );
}

export default ThemeToggle;