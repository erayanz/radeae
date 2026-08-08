import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-brand-navy border border-brand-graphite/60 rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Container;
