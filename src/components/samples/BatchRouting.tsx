import React, { useState, useEffect } from 'react';
import { Route, ArrowRight, Building2, Cpu, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useSampleStore } from '@/stores/sample.store';
import { useTests } from '@/hooks/useTests';
import { toast } from 'sonner';
import type { Sample } from '@/types/sample.types';
import type { TestDefinition } from '@/types/test.types';

interface RoutingRule {
  testId: string;
  departmentId: string;
  analyzerId?: string;
}

interface SampleRouting {
  sampleId: string;
  departmentId: string;
  analyzerId?: string;
  priority: 'routine' | 'urgent' | 'stat';
}

export const BatchRouting: React.FC = () => {
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [manualRouting, setManualRouting] = useState<SampleRouting[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRoute, setAutoRoute] = useState(true);

  const { samples, updateBatchSamples } = useSampleStore();
  const { tests } = useTestStore();
  const { departments } = useDepartmentStore();
  const { analyzers } = useAnalyzerStore();

  // Filter samples that need routing
  const samplesToRoute = samples.filter(s => 
    s.status === 'received' && !s.departmentId
  );

  useEffect(() => {
    // Load default routing rules based on test types
    const defaultRules: RoutingRule[] = tests.map(test => ({
      testId: test.id,
      departmentId: test.departmentId || '',
      analyzerId: test.defaultAnalyzerId
    })).filter(rule => rule.departmentId);

    setRoutingRules(defaultRules);
  }, [tests]);

  const handleSelectAll = () => {
    if (selectedSamples.length === samplesToRoute.length) {
      setSelectedSamples([]);
    } else {
      setSelectedSamples(samplesToRoute.map(s => s.id));
    }
  };

  const handleSampleSelect = (sampleId: string) => {
    setSelectedSamples(prev => 
      prev.includes(sampleId) 
        ? prev.filter(id => id !== sampleId)
        : [...prev, sampleId]
    );
  };

  const getRoutingForSample = (sample: Sample): SampleRouting | null => {
    // Check manual routing first
    const manual = manualRouting.find(r => r.sampleId === sample.id);
    if (manual) return manual;

    // Auto-route based on test type
    if (autoRoute) {
      const rule = routingRules.find(r => r.testId === sample.testId);
      if (rule && rule.departmentId) {
        return {
          sampleId: sample.id,
          departmentId: rule.departmentId,
          analyzerId: rule.analyzerId,
          priority: sample.priority || 'routine'
        };
      }
    }

    return null;
  };

  const handleManualRoute = (sampleId: string, departmentId: string, analyzerId?: string) => {
    setManualRouting(prev => {
      const existing = prev.findIndex(r => r.sampleId === sampleId);
      const routing: SampleRouting = {
        sampleId,
        departmentId,
        analyzerId,
        priority: 'routine'
      };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = routing;
        return updated;
      } else {
        return [...prev, routing];
      }
    });
  };

  const handleBatchRoute = async () => {
    const samplesToProcess = selectedSamples.length > 0 
      ? selectedSamples 
      : samplesToRoute.map(s => s.id);

    const updates: Array<{ id: string; [key: string]: any }> = [];

    for (const sampleId of samplesToProcess) {
      const sample = samples.find(s => s.id === sampleId);
      if (!sample) continue;

      const routing = getRoutingForSample(sample);
      if (!routing) {
        toast.error(`No routing defined for sample ${sample.sampleNumber}`);
        continue;
      }

      updates.push({
        id: sampleId,
        departmentId: routing.departmentId,
        analyzerId: routing.analyzerId,
        routedAt: new Date(),
        routedBy: 'current-user', // TODO: Get from auth context
        chainOfCustody: [
          ...(sample.chainOfCustody || []),
          {
            action: 'routed',
            timestamp: new Date(),
            userId: 'current-user',
            location: departments.find(d => d.id === routing.departmentId)?.name || 'Unknown',
            notes: `Routed to ${departments.find(d => d.id === routing.departmentId)?.name}${
              routing.analyzerId ? ` - ${analyzers.find(a => a.id === routing.analyzerId)?.name}` : ''
            }`
          }
        ]
      });
    }

    if (updates.length === 0) {
      toast.error('No samples to route');
      return;
    }

    setIsProcessing(true);

    try {
      await updateBatchSamples(updates);
      toast.success(`Successfully routed ${updates.length} samples`);
      setSelectedSamples([]);
      setManualRouting([]);
    } catch (error) {
      toast.error('Failed to route samples');
      console.error('Batch routing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const groupedByDepartment = samplesToRoute.reduce((acc, sample) => {
    const routing = getRoutingForSample(sample);
    const deptId = routing?.departmentId || 'unassigned';
    if (!acc[deptId]) acc[deptId] = [];
    acc[deptId].push(sample);
    return acc;
  }, {} as Record<string, Sample[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Batch Sample Routing
          </CardTitle>
          <CardDescription>
            Route samples to appropriate departments and analyzers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedSamples.length === samplesToRoute.length ? 'Deselect All' : 'Select All'}
              </Button>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoRoute"
                  checked={autoRoute}
                  onCheckedChange={(checked) => setAutoRoute(checked as boolean)}
                />
                <label htmlFor="autoRoute" className="text-sm">
                  Auto-route based on test type
                </label>
              </div>
            </div>
            <Badge variant="outline">
              {samplesToRoute.length} samples pending routing
            </Badge>
          </div>

          {/* Routing Preview */}
          {Object.entries(groupedByDepartment).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Routing Preview</h3>
              <div className="grid gap-4">
                {Object.entries(groupedByDepartment).map(([deptId, deptSamples]) => {
                  const department = departments.find(d => d.id === deptId);
                  return (
                    <Card key={deptId} className={deptId === 'unassigned' ? 'border-red-200' : ''}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">
                              {department?.name || 'Unassigned'}
                            </span>
                          </div>
                          <Badge>{deptSamples.length} samples</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-2">
                            {deptSamples.map(sample => {
                              const routing = getRoutingForSample(sample);
                              const isSelected = selectedSamples.includes(sample.id);
                              
                              return (
                                <div
                                  key={sample.id}
                                  className={`flex items-center justify-between p-2 rounded-lg border ${
                                    isSelected ? 'bg-blue-50 border-blue-200' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleSampleSelect(sample.id)}
                                    />
                                    <div>
                                      <p className="font-mono text-sm">{sample.sampleNumber}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {sample.patientName} - {sample.testName}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {deptId === 'unassigned' && (
                                    <div className="flex items-center space-x-2">
                                      <Select
                                        onValueChange={(value) => {
                                          const [deptId, analyzerId] = value.split('|');
                                          handleManualRoute(sample.id, deptId, analyzerId || undefined);
                                        }}
                                      >
                                        <SelectTrigger className="w-48">
                                          <SelectValue placeholder="Select destination" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {departments.map(dept => (
                                            <React.Fragment key={dept.id}>
                                              <SelectItem value={dept.id}>
                                                {dept.name}
                                              </SelectItem>
                                              {analyzers
                                                .filter(a => a.departmentId === dept.id)
                                                .map(analyzer => (
                                                  <SelectItem 
                                                    key={analyzer.id} 
                                                    value={`${dept.id}|${analyzer.id}`}
                                                  >
                                                    <span className="ml-4">
                                                      <Cpu className="inline h-3 w-3 mr-1" />
                                                      {analyzer.name}
                                                    </span>
                                                  </SelectItem>
                                                ))}
                                            </React.Fragment>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  
                                  {routing?.analyzerId && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <ArrowRight className="h-3 w-3 mx-1" />
                                      <Cpu className="h-3 w-3 mr-1" />
                                      {analyzers.find(a => a.id === routing.analyzerId)?.name}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Button */}
          {samplesToRoute.length > 0 && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleBatchRoute}
              disabled={isProcessing || (Object.keys(groupedByDepartment).includes('unassigned') && groupedByDepartment['unassigned'].length > 0)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Routing Samples...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Route {selectedSamples.length || samplesToRoute.length} Samples
                </>
              )}
            </Button>
          )}

          {samplesToRoute.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No samples pending routing</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};