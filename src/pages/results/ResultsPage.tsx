import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

const ResultsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Results</h1>
        <p className="text-gray-600 mt-2">Manage test results and validations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Results Management
          </CardTitle>
          <CardDescription>
            Enter, validate, and approve laboratory test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Results management coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsPage;