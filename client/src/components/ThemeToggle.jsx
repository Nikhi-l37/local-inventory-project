import React, { useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

// GitHub-inspired theme toggle button style
const buttonStyle = {
  background: 'var(--bg-inset)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
};

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Helper to determine the correct icon based on the three themes
  const getIcon = () => {
    if (theme === 'light') return '☀️'; // Sun for light
    if (theme === 'dark') return '🌙'; // Moon for dark
    return '🛡️'; // Shield or something unique for ScreenCoach theme
  };

  return (
    <button 
      onClick={toggleTheme} 
      style={buttonStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        e.currentTarget.style.borderColor = 'var(--text-color-light)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-inset)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      aria-label="Toggle theme"
    >
      {getIcon()}
    </button>
  );
}

export default ThemeToggle;