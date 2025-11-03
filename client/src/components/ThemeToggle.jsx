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

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button onClick={toggleTheme} style={buttonStyle}>
      {/* Show an icon based on the current theme */}
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeToggle;