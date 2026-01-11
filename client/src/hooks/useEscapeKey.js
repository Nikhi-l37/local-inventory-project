import { useEffect } from 'react';

/**
 * Custom hook to handle Escape key press for closing modals
 * @param {boolean} isOpen - Whether the modal is currently open
 * @param {Function} onClose - Callback function to close the modal
 */
export function useEscapeKey(isOpen, onClose) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);
}
