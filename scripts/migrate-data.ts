#!/usr/bin/env ts-node

/**
 * Data Migration Script for LabFlow
 * Migrates data from legacy systems to LabFlow Firebase
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json');
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const PROJECT_PREFIX = 'labflow_';

// Migration interfaces
interface LegacyPatient {
  patient_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  insurance_provider?: string;
  insurance_id?: string;
}

interface LegacyTest {
  test_code: string;
  test_name: string;
  department: string;
  specimen_type: string;
  reference_range_low?: string;
  reference_range_high?: string;
  unit?: string;
  loinc_code?: string;
}

interface MigrationResult {
  success: boolean;
  recordsProcessed: number;
  recordsMigrated: number;
  errors: string[];
}

class DataMigrator {
  private tenantId: string;
  private batchSize = 500;
  private errors: string[] = [];

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Migrate patients from CSV file
   */
  async migratePatients(csvFilePath: string): Promise<MigrationResult> {
    console.log('Starting patient migration...');
    const patients: LegacyPatient[] = await this.readCsvFile(csvFilePath);
    
    let migrated = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const patient of patients) {
      try {
        const patientId = this.generateId(patient.patient_id);
        const docRef = db.collection(`${PROJECT_PREFIX}patients`).doc(patientId);
        
        const patientData = {
          id: patientId,
          tenantId: this.tenantId,
          mrn: patient.patient_id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          dateOfBirth: patient.dob,
          gender: patient.gender.toLowerCase(),
          email: patient.email || '',
          phone: patient.phone || '',
          address: {
            street: patient.address || '',
            city: patient.city || '',
            state: patient.state || '',
            zip: patient.zip || '',
          },
          insurance: patient.insurance_provider ? {
            provider: patient.insurance_provider,
            policyNumber: patient.insurance_id || '',
          } : null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          isActive: true,
        };

        batch.set(docRef, patientData);
        batchCount++;

        if (batchCount >= this.batchSize) {
          await batch.commit();
          migrated += batchCount;
          batchCount = 0;
          console.log(`Migrated ${migrated} patients...`);
        }
      } catch (error) {
        this.errors.push(`Patient ${patient.patient_id}: ${error.message}`);
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      migrated += batchCount;
    }

    return {
      success: this.errors.length === 0,
      recordsProcessed: patients.length,
      recordsMigrated: migrated,
      errors: this.errors,
    };
  }

  /**
   * Migrate tests from CSV file
   */
  async migrateTests(csvFilePath: string): Promise<MigrationResult> {
    console.log('Starting test migration...');
    const tests: LegacyTest[] = await this.readCsvFile(csvFilePath);
    
    let migrated = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const test of tests) {
      try {
        const testId = this.generateId(test.test_code);
        const docRef = db.collection(`${PROJECT_PREFIX}tests`).doc(testId);
        
        const testData = {
          id: testId,
          tenantId: this.tenantId,
          code: test.test_code,
          name: test.test_name,
          department: test.department.toLowerCase(),
          specimenType: test.specimen_type,
          referenceRange: {
            low: parseFloat(test.reference_range_low) || null,
            high: parseFloat(test.reference_range_high) || null,
            unit: test.unit || '',
          },
          loincCode: test.loinc_code || '',
          turnaroundTime: 24, // Default 24 hours
          isActive: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        batch.set(docRef, testData);
        batchCount++;

        if (batchCount >= this.batchSize) {
          await batch.commit();
          migrated += batchCount;
          batchCount = 0;
          console.log(`Migrated ${migrated} tests...`);
        }
      } catch (error) {
        this.errors.push(`Test ${test.test_code}: ${error.message}`);
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      migrated += batchCount;
    }

    return {
      success: this.errors.length === 0,
      recordsProcessed: tests.length,
      recordsMigrated: migrated,
      errors: this.errors,
    };
  }

  /**
   * Migrate historical results
   */
  async migrateResults(jsonFilePath: string): Promise<MigrationResult> {
    console.log('Starting results migration...');
    const results = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
    
    let migrated = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const result of results) {
      try {
        const resultId = this.generateId(`${result.sample_id}_${result.test_code}`);
        const docRef = db.collection(`${PROJECT_PREFIX}results`).doc(resultId);
        
        const resultData = {
          id: resultId,
          tenantId: this.tenantId,
          patientId: this.generateId(result.patient_id),
          sampleId: this.generateId(result.sample_id),
          testId: this.generateId(result.test_code),
          value: result.value,
          unit: result.unit || '',
          referenceRange: result.reference_range || '',
          flags: result.abnormal_flag ? [result.abnormal_flag] : [],
          status: 'approved',
          resultDate: Timestamp.fromDate(new Date(result.result_date)),
          approvedBy: result.verified_by || 'legacy_import',
          approvedAt: Timestamp.fromDate(new Date(result.verified_date || result.result_date)),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        batch.set(docRef, resultData);
        batchCount++;

        if (batchCount >= this.batchSize) {
          await batch.commit();
          migrated += batchCount;
          batchCount = 0;
          console.log(`Migrated ${migrated} results...`);
        }
      } catch (error) {
        this.errors.push(`Result ${result.sample_id}: ${error.message}`);
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      migrated += batchCount;
    }

    return {
      success: this.errors.length === 0,
      recordsProcessed: results.length,
      recordsMigrated: migrated,
      errors: this.errors,
    };
  }

  /**
   * Read CSV file and parse to objects
   */
  private async readCsvFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          records.push(record);
        }
      });

      parser.on('error', reject);
      parser.on('end', () => resolve(records));

      fs.createReadStream(filePath).pipe(parser);
    });
  }

  /**
   * Generate consistent Firebase ID from legacy ID
   */
  private generateId(legacyId: string): string {
    const hash = createHash('md5').update(`${this.tenantId}_${legacyId}`).digest('hex');
    return hash.substring(0, 20);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: yarn migrate <tenant-id> <type> <file-path>');
    console.error('Types: patients, tests, results');
    process.exit(1);
  }

  const [tenantId, type, filePath] = args;
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const migrator = new DataMigrator(tenantId);
  let result: MigrationResult;

  try {
    switch (type) {
      case 'patients':
        result = await migrator.migratePatients(filePath);
        break;
      case 'tests':
        result = await migrator.migrateTests(filePath);
        break;
      case 'results':
        result = await migrator.migrateResults(filePath);
        break;
      default:
        console.error(`Unknown migration type: ${type}`);
        process.exit(1);
    }

    console.log('\nMigration Complete:');
    console.log(`- Records Processed: ${result.recordsProcessed}`);
    console.log(`- Records Migrated: ${result.recordsMigrated}`);
    console.log(`- Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.error('\nErrors:');
      result.errors.slice(0, 10).forEach(error => console.error(`  - ${error}`));
      if (result.errors.length > 10) {
        console.error(`  ... and ${result.errors.length - 10} more errors`);
      }
      
      // Write all errors to file
      const errorFile = `migration-errors-${Date.now()}.log`;
      fs.writeFileSync(errorFile, result.errors.join('\n'));
      console.log(`\nAll errors written to: ${errorFile}`);
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DataMigrator };