import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 text-center text-slate-400 text-sm">
      <p>&copy; {new Date().getFullYear()} HealthLens AI. Powered by Google Gemini.</p>
      <p className="mt-1">Designed for research and educational use only.</p>
    </footer>
  );
};

export default Footer;
