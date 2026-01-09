import React from 'react';
import { Link } from 'react-router-dom';

// This style will be applied to the <span> text
const logoTextStyle = {
  fontSize: '1.6em',
  fontWeight: 'bold',
  lineHeight: '1',
  fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

function Logo({ simple = false }) {
  const content = (
    <>
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginRight: '10px', flexShrink: 0 }}
      >
        {/* Pin Shape */}
        <path
          d="M50 15 C33.43 15 20 28.43 20 45 C20 63 42 82 50 90 C58 82 80 63 80 45 C80 28.43 66.57 15 50 15 Z"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
        />
        {/* Inner Circle */}
        <circle cx="50" cy="45" r="12" stroke="currentColor" strokeWidth="6" fill="none" />

        {/* Bottom Ring (Orbit) */}
        <ellipse cx="50" cy="85" rx="35" ry="10" stroke="currentColor" strokeWidth="6" fill="none" />
      </svg>
      <span style={{ ...logoTextStyle, fontFamily: 'serif', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Finder
      </span>
    </>
  );

  if (simple) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to="/"
      style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        color: 'inherit'
      }}
    >
      {content}
    </Link>
  );
}

export default Logo;