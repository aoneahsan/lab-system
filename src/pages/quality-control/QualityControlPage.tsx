import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

const QualityControlPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
        <p className="text-gray-600 mt-2">Monitor and maintain laboratory quality standards</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quality Control Management
          </CardTitle>
          <CardDescription>
            QC runs, Levey-Jennings charts, and Westgard rules monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Quality control management coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityControlPage;