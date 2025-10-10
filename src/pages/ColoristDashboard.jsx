import React from 'react';
import ColoristDashboard from '../components/ColoristDashboard';

const ColoristDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <ColoristDashboard />
      </div>
    </div>
  );
};

export default ColoristDashboardPage;
