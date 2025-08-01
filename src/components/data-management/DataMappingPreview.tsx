import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ColumnMapping } from '@/utils/import-export/excel-parser';
import { ValidationResult } from '@/utils/import-export/data-validator';

interface DataMappingPreviewProps {
  sourceHeaders: string[];
  targetFields: Array<{
    name: string;
    label: string;
    required: boolean;
    type?: string;
  }>;
  sampleData: any[];
  validationResult?: ValidationResult;
  onMappingChange: (mappings: ColumnMapping[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DataMappingPreview: React.FC<DataMappingPreviewProps> = ({
  sourceHeaders,
  targetFields,
  sampleData,
  validationResult,
  onMappingChange,
  onConfirm,
  onCancel,
}) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Auto-map fields based on similarity
  React.useEffect(() => {
    const autoMappings: Record<string, string> = {};
    
    targetFields.forEach(field => {
      const fieldNameLower = field.name.toLowerCase();
      const fieldLabelLower = field.label.toLowerCase();
      
      // Find best matching source header
      const exactMatch = sourceHeaders.find(
        header => header.toLowerCase() === fieldNameLower ||
                  header.toLowerCase() === fieldLabelLower
      );
      
      if (exactMatch) {
        autoMappings[field.name] = exactMatch;
      } else {
        // Try partial matches
        const partialMatch = sourceHeaders.find(
          header => header.toLowerCase().includes(fieldNameLower) ||
                    fieldNameLower.includes(header.toLowerCase()) ||
                    header.toLowerCase().includes(fieldLabelLower) ||
                    fieldLabelLower.includes(header.toLowerCase())
        );
        
        if (partialMatch) {
          autoMappings[field.name] = partialMatch;
        }
      }
    });
    
    setMappings(autoMappings);
  }, [sourceHeaders, targetFields]);

  // Generate column mappings for parent
  React.useEffect(() => {
    const columnMappings: ColumnMapping[] = targetFields.map(field => ({
      source: mappings[field.name] || '',
      target: field.name,
      required: field.required,
    }));
    
    onMappingChange(columnMappings);
  }, [mappings, targetFields, onMappingChange]);

  const handleMappingChange = (targetField: string, sourceHeader: string) => {
    setMappings(prev => ({
      ...prev,
      [targetField]: sourceHeader,
    }));
  };

  const unmappedRequired = useMemo(() => {
    return targetFields.filter(
      field => field.required && !mappings[field.name]
    );
  }, [targetFields, mappings]);

  const getMappedValue = (row: any, targetField: string) => {
    const sourceField = mappings[targetField];
    if (!sourceField) return null;
    
    const sourceIndex = sourceHeaders.indexOf(sourceField);
    return sourceIndex !== -1 ? row[sourceIndex] : null;
  };

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === sampleData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(Array.from({ length: sampleData.length }, (_, i) => i)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Mapping Configuration */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <h3 className="text-sm font-semibold mb-3">Field Mapping</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {targetFields.map(field => (
            <div
              key={field.name}
              className="flex items-center gap-3 py-1"
            >
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-medium min-w-[150px]">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
              <Select
                value={mappings[field.name] || ''}
                onValueChange={(value) => handleMappingChange(field.name, value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select source column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {sourceHeaders.map(header => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mappings[field.name] ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : field.required ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <div className="w-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Validation Summary */}
      {validationResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Badge variant={validationResult.isValid ? 'default' : 'destructive'}>
              {validationResult.summary.validRecords} Valid
            </Badge>
            {validationResult.summary.invalidRecords > 0 && (
              <Badge variant="destructive">
                {validationResult.summary.invalidRecords} Invalid
              </Badge>
            )}
            {validationResult.summary.recordsWithWarnings > 0 && (
              <Badge variant="secondary">
                {validationResult.summary.recordsWithWarnings} Warnings
              </Badge>
            )}
          </div>

          {validationResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Found {validationResult.errors.length} validation errors.
                Please review and fix the issues before importing.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Unmapped Required Fields Warning */}
      {unmappedRequired.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The following required fields are not mapped:{' '}
            {unmappedRequired.map(f => f.label).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Data Preview */}
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-semibold">Data Preview</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
        </div>

        {showPreview && (
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedRows.size === sampleData.length}
                      onCheckedChange={toggleAllRows}
                    />
                  </TableHead>
                  <TableHead className="w-[80px]">Row</TableHead>
                  {targetFields
                    .filter(field => mappings[field.name])
                    .map(field => (
                      <TableHead key={field.name}>
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.slice(0, 10).map((row, index) => {
                  const rowErrors = validationResult?.errors.filter(
                    e => e.row === index + 1
                  );
                  const hasErrors = rowErrors && rowErrors.length > 0;

                  return (
                    <TableRow
                      key={index}
                      className={hasErrors ? 'bg-red-50 dark:bg-red-950' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(index)}
                          onCheckedChange={() => toggleRowSelection(index)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {index + 1}
                          {hasErrors && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      {targetFields
                        .filter(field => mappings[field.name])
                        .map(field => (
                          <TableCell key={field.name}>
                            <div className="max-w-[200px] truncate">
                              {getMappedValue(row, field.name) || (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                        ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {Math.min(10, sampleData.length)} of {sampleData.length} rows
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={unmappedRequired.length > 0 || validationResult?.errors.length > 0}
          >
            Import {selectedRows.size > 0 ? selectedRows.size : 'All'} Records
          </Button>
        </div>
      </div>
    </div>
  );
};