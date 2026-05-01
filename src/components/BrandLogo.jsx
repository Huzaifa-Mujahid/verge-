import React from 'react';

const BrandLogo = ({ size = 'md', className = '' }) => {
  const isLarge = size === 'lg';
  
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/logo.png?v=4" 
        className={`${isLarge ? 'h-20' : 'h-14'} w-auto object-contain`} 
        alt="Allied Marketing Solutions" 
      />
    </div>
  );
};

export default BrandLogo;
