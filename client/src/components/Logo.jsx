import React from 'react';
import { Link } from 'react-router-dom';

// This style will be applied to the <span> text
const logoTextStyle = {
  fontSize: '1.6em', // Slightly bigger
  fontWeight: 'bold',
  lineHeight: '1',
  fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', // Cleaner font
};

function Logo() {
  return (
    <Link 
      to="/" 
      style={{ 
        textDecoration: 'none', 
        display: 'flex', 
        alignItems: 'center',
        color: 'inherit' // This tells the text to inherit its color (white or blue)
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginRight: '8px', flexShrink: 0 }}
      >
        {/* The SVG will now use 'currentColor' to match the text */}
        <path
          d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
          fill="currentColor" // The magic property!
        />
      </svg>
      <span style={logoTextStyle}>
        Finder
      </span>
    </Link>
  );
}

export default Logo;