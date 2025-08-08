import React from 'react';
import QCDashboard from '@/components/quality-control/QCDashboard';

const QualityControlPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <QCDashboard />
    </div>
  );
};

export default QualityControlPage;
