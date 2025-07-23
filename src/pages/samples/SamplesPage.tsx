import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube } from 'lucide-react';

const SamplesPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Samples</h1>
        <p className="text-gray-600 mt-2">Track and manage laboratory samples</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Sample Tracking
          </CardTitle>
          <CardDescription>
            Monitor sample collection, processing, and chain of custody
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Sample tracking coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SamplesPage;