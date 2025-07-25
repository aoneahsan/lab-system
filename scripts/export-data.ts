#!/usr/bin/env ts-node

/**
 * Data Export Script for LabFlow
 * Exports data from Firebase for backup or migration
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { Parser } from 'json2csv';

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json');
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const PROJECT_PREFIX = 'labflow_';

interface ExportOptions {
  tenantId: string;
  collection: string;
  format: 'json' | 'csv';
  outputDir: string;
  dateFrom?: Date;
  dateTo?: Date;
  batchSize?: number;
}

class DataExporter {
  private options: ExportOptions;
  private recordCount = 0;

  constructor(options: ExportOptions) {
    this.options = {
      batchSize: 1000,
      ...options,
    };
  }

  /**
   * Export data from specified collection
   */
  async export(): Promise<void> {
    console.log(`Starting export of ${this.options.collection} for tenant ${this.options.tenantId}...`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    let query = db.collection(`${PROJECT_PREFIX}${this.options.collection}`)
      .where('tenantId', '==', this.options.tenantId);

    // Add date filters if provided
    if (this.options.dateFrom) {
      query = query.where('createdAt', '>=', this.options.dateFrom);
    }
    if (this.options.dateTo) {
      query = query.where('createdAt', '<=', this.options.dateTo);
    }

    // Export in batches
    let lastDoc = null;
    let hasMore = true;
    const allRecords: any[] = [];

    while (hasMore) {
      let batch = query.limit(this.options.batchSize);
      
      if (lastDoc) {
        batch = batch.startAfter(lastDoc);
      }

      const snapshot = await batch.get();
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      const records = snapshot.docs.map(doc => ({
        ...doc.data(),
        _id: doc.id,
        _exportedAt: new Date().toISOString(),
      }));

      allRecords.push(...records);
      this.recordCount += records.length;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      console.log(`Exported ${this.recordCount} records...`);
    }

    // Save to file
    await this.saveToFile(allRecords);
    console.log(`Export complete! Total records: ${this.recordCount}`);
  }

  /**
   * Export all collections for a tenant
   */
  async exportAll(): Promise<void> {
    const collections = [
      'patients',
      'samples',
      'tests',
      'results',
      'invoices',
      'users',
      'audit_logs',
    ];

    for (const collection of collections) {
      try {
        await this.export();
        console.log(`✓ Exported ${collection}`);
      } catch (error) {
        console.error(`✗ Failed to export ${collection}:`, error.message);
      }
    }
  }

  /**
   * Save records to file in specified format
   */
  private async saveToFile(records: any[]): Promise<void> {
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `${this.options.collection}_${this.options.tenantId}_${timestamp}`;
    
    if (this.options.format === 'json') {
      const filepath = path.join(this.options.outputDir, `${filename}.json`);
      fs.writeFileSync(filepath, JSON.stringify(records, null, 2));
      console.log(`Saved to: ${filepath}`);
    } else if (this.options.format === 'csv') {
      if (records.length === 0) {
        console.log('No records to export');
        return;
      }

      // Flatten nested objects for CSV
      const flatRecords = records.map(record => this.flattenObject(record));
      
      const parser = new Parser({
        fields: Object.keys(flatRecords[0]),
      });
      
      const csv = parser.parse(flatRecords);
      const filepath = path.join(this.options.outputDir, `${filename}.csv`);
      fs.writeFileSync(filepath, csv);
      console.log(`Saved to: ${filepath}`);
    }
  }

  /**
   * Flatten nested object for CSV export
   */
  private flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {};
    
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) {
        flattened[prefix + key] = '';
      } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        Object.assign(flattened, this.flattenObject(obj[key], `${prefix}${key}_`));
      } else if (Array.isArray(obj[key])) {
        flattened[prefix + key] = obj[key].join(', ');
      } else if (obj[key] instanceof Date) {
        flattened[prefix + key] = obj[key].toISOString();
      } else {
        flattened[prefix + key] = obj[key];
      }
    }
    
    return flattened;
  }
}

/**
 * Create backup of entire tenant data
 */
async function createBackup(tenantId: string, outputDir: string): Promise<void> {
  const collections = [
    'patients',
    'samples', 
    'tests',
    'results',
    'invoices',
    'inventory',
    'quality_control',
    'users',
    'audit_logs',
  ];

  const backupDir = path.join(outputDir, `backup_${tenantId}_${format(new Date(), 'yyyyMMdd_HHmmss')}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`Creating backup for tenant ${tenantId}...`);
  
  for (const collection of collections) {
    const exporter = new DataExporter({
      tenantId,
      collection,
      format: 'json',
      outputDir: backupDir,
    });
    
    try {
      await exporter.export();
    } catch (error) {
      console.error(`Failed to backup ${collection}:`, error.message);
    }
  }

  // Create metadata file
  const metadata = {
    tenantId,
    backupDate: new Date().toISOString(),
    collections: collections,
    version: '1.0.0',
  };
  
  fs.writeFileSync(
    path.join(backupDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log(`Backup complete! Location: ${backupDir}`);
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage:');
    console.error('  Export single collection: yarn export <tenant-id> <collection> [format] [output-dir]');
    console.error('  Create full backup: yarn export backup <tenant-id> [output-dir]');
    console.error('');
    console.error('Collections: patients, samples, tests, results, invoices, users, audit_logs');
    console.error('Formats: json (default), csv');
    process.exit(1);
  }

  if (args[0] === 'backup') {
    const [, tenantId, outputDir = './exports'] = args;
    await createBackup(tenantId, outputDir);
  } else {
    const [tenantId, collection, format = 'json', outputDir = './exports'] = args;
    
    const exporter = new DataExporter({
      tenantId,
      collection,
      format: format as 'json' | 'csv',
      outputDir,
    });
    
    await exporter.export();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Export failed:', error);
    process.exit(1);
  });
}

export { DataExporter, createBackup };