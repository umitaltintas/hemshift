
import React from 'react';
import Header from './Header';
import Tabs from './Tabs';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <Tabs />
        </div>
        <main className="bg-white shadow-md rounded-lg p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
