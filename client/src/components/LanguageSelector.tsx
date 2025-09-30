import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="relative h-9 w-9 transition-all duration-500 hover:scale-110 group"
    >
      {/* Outer glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-green-400 opacity-50 blur-sm group-hover:opacity-70 transition-opacity"></div>
      
      {/* Main sphere */}
      <div className="relative h-full w-full rounded-full overflow-hidden shadow-lg">
        {/* Ocean blue gradient - represents water on Earth */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"></div>
        
        {/* Continental patches - represents land masses */}
        <div className="absolute top-1 left-2 w-3 h-2 bg-green-500 rounded-full opacity-80 blur-sm"></div>
        <div className="absolute top-3 right-1 w-2 h-3 bg-green-600 rounded-full opacity-70 blur-sm"></div>
        <div className="absolute bottom-2 left-1 w-2 h-1.5 bg-green-500 rounded-full opacity-75 blur-sm"></div>
        
        {/* Atmosphere effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/20 rounded-full"></div>
        
        {/* Sphere highlight - gives 3D effect */}
        <div className="absolute top-0.5 left-1 w-3 h-3 bg-white/40 rounded-full blur-sm"></div>
        
        {/* Language text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-xs drop-shadow-md">
            {language === 'en' ? 'EN' : 'AR'}
          </span>
        </div>
      </div>
      
      {/* Orbit ring */}
      <div className="absolute inset-[-3px] rounded-full border border-blue-300/30 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:animate-spin-slow"></div>
      
      {/* Second orbit ring */}
      <div className="absolute inset-[-6px] rounded-full border border-blue-200/20 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-spin-slow" style={{ animationDelay: '0.5s' }}></div>
    </button>
  );
};

export default LanguageSelector;