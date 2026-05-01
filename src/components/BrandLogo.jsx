import React from 'react';

const BrandLogo = ({ size = 'md', className = '' }) => {
  const isLarge = size === 'lg';
  
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/logo.png?v=2" 
        className={`${isLarge ? 'h-20' : 'h-14'} w-auto object-contain`} 
        alt="Digital Orbit Solutions Logo" 
      />
    </div>
  );
};

export default BrandLogo;
