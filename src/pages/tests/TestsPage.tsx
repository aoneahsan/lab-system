import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flask } from 'lucide-react';

const TestsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
        <p className="text-gray-600 mt-2">Manage laboratory tests and panels</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flask className="h-5 w-5" />
            Tests Management
          </CardTitle>
          <CardDescription>
            View and manage laboratory tests, panels, and profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Flask className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tests management coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestsPage;