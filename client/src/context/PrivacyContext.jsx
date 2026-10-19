import React, { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext(null);

export const PrivacyProvider = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    return localStorage.getItem('dompet_privacy_mode') === 'true';
  });

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('dompet_privacy_mode', String(next));
      return next;
    });
  };

  // Global Keyboard Shortcut: Press "H" to toggle Privacy Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
        e.target.isContentEditable
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        togglePrivacyMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Masks financial text when privacy mode is active
   * @param {string} text - e.g. "Rp 10.000.000"
   * @param {string} maskReplacement - default "Rp ••••••"
   * @returns {string}
   */
  const mask = (text, maskReplacement = 'Rp ••••••') => {
    if (!isPrivacyMode) return text;
    if (typeof text === 'string' && text.startsWith('Rp')) {
      return maskReplacement;
    }
    return '••••••';
  };

  return (
    <PrivacyContext.Provider
      value={{
        isPrivacyMode,
        togglePrivacyMode,
        mask,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};
