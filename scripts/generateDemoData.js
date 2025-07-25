import { faker } from '@faker-js/faker';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test codes based on common lab tests
const testCodes = [
  { code: 'CBC', name: 'Complete Blood Count', department: 'Hematology', price: 25 },
  { code: 'BMP', name: 'Basic Metabolic Panel', department: 'Chemistry', price: 35 },
  { code: 'CMP', name: 'Comprehensive Metabolic Panel', department: 'Chemistry', price: 45 },
  { code: 'LFT', name: 'Liver Function Tests', department: 'Chemistry', price: 40 },
  { code: 'LIPID', name: 'Lipid Panel', department: 'Chemistry', price: 30 },
  { code: 'TSH', name: 'Thyroid Stimulating Hormone', department: 'Chemistry', price: 50 },
  { code: 'HBA1C', name: 'Hemoglobin A1C', department: 'Chemistry', price: 35 },
  { code: 'UA', name: 'Urinalysis', department: 'Urinalysis', price: 20 },
  { code: 'PT/INR', name: 'Prothrombin Time', department: 'Coagulation', price: 30 },
  { code: 'COVID19', name: 'COVID-19 PCR', department: 'Molecular', price: 100 }
];

// Generate demo patients
function generatePatients(count = 100) {
  const patients = [];
  for (let i = 0; i < count; i++) {
    const patient = {
      id: faker.string.uuid(),
      mrn: `MRN${faker.string.numeric(6)}`,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 90, mode: 'age' }),
      gender: faker.helpers.arrayElement(['Male', 'Female']),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode()
      },
      insurance: {
        provider: faker.helpers.arrayElement(['Blue Cross', 'Aetna', 'United Healthcare', 'Medicare', 'Medicaid']),
        memberId: faker.string.alphanumeric(10).toUpperCase()
      },
      createdAt: faker.date.past({ years: 2 })
    };
    patients.push(patient);
  }
  return patients;
}

// Generate demo test orders
function generateTestOrders(patients, count = 500) {
  const orders = [];
  for (let i = 0; i < count; i++) {
    const patient = faker.helpers.arrayElement(patients);
    const orderDate = faker.date.recent({ days: 30 });
    const tests = faker.helpers.arrayElements(testCodes, { min: 1, max: 5 });
    
    const order = {
      id: faker.string.uuid(),
      orderNumber: `ORD${faker.string.numeric(8)}`,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMRN: patient.mrn,
      orderDate: orderDate,
      priority: faker.helpers.arrayElement(['Routine', 'STAT', 'ASAP']),
      orderingProvider: `Dr. ${faker.person.firstName()} ${faker.person.lastName()}`,
      diagnosis: faker.helpers.arrayElement(['Annual checkup', 'Diabetes monitoring', 'Hypertension', 'Pre-operative', 'Follow-up']),
      tests: tests.map(test => ({
        testCode: test.code,
        testName: test.name,
        department: test.department,
        status: faker.helpers.arrayElement(['Pending', 'In Progress', 'Completed', 'Verified']),
        price: test.price
      })),
      totalAmount: tests.reduce((sum, test) => sum + test.price, 0),
      status: faker.helpers.arrayElement(['Active', 'Completed', 'Cancelled'])
    };
    orders.push(order);
  }
  return orders;
}

// Generate demo results
function generateResults(orders) {
  const results = [];
  const completedOrders = orders.filter(order => order.status === 'Completed');
  
  completedOrders.forEach(order => {
    order.tests.forEach(test => {
      if (test.status === 'Verified') {
        const result = {
          id: faker.string.uuid(),
          orderId: order.id,
          testCode: test.testCode,
          testName: test.testName,
          value: generateTestValue(test.testCode),
          unit: getTestUnit(test.testCode),
          referenceRange: getReferenceRange(test.testCode),
          flag: faker.helpers.weightedArrayElement([
            { value: 'Normal', weight: 70 },
            { value: 'High', weight: 15 },
            { value: 'Low', weight: 15 }
          ]),
          performedBy: `Tech ${faker.person.firstName()}`,
          verifiedBy: `Dr. ${faker.person.lastName()}`,
          resultDate: faker.date.between({ from: order.orderDate, to: new Date() }),
          comments: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.1 })
        };
        results.push(result);
      }
    });
  });
  
  return results;
}

// Helper functions for generating test-specific values
function generateTestValue(testCode) {
  switch (testCode) {
    case 'CBC':
      return {
        WBC: faker.number.float({ min: 4.5, max: 11.0, fractionDigits: 1 }),
        RBC: faker.number.float({ min: 4.5, max: 6.0, fractionDigits: 1 }),
        HGB: faker.number.float({ min: 12.0, max: 17.5, fractionDigits: 1 }),
        HCT: faker.number.float({ min: 36.0, max: 50.0, fractionDigits: 1 }),
        PLT: faker.number.int({ min: 150, max: 400 })
      };
    case 'BMP':
      return {
        Glucose: faker.number.int({ min: 70, max: 130 }),
        BUN: faker.number.int({ min: 7, max: 25 }),
        Creatinine: faker.number.float({ min: 0.6, max: 1.3, fractionDigits: 1 }),
        Sodium: faker.number.int({ min: 135, max: 145 }),
        Potassium: faker.number.float({ min: 3.5, max: 5.1, fractionDigits: 1 }),
        Chloride: faker.number.int({ min: 98, max: 107 }),
        CO2: faker.number.int({ min: 22, max: 29 })
      };
    case 'LIPID':
      return {
        TotalCholesterol: faker.number.int({ min: 125, max: 250 }),
        HDL: faker.number.int({ min: 40, max: 80 }),
        LDL: faker.number.int({ min: 70, max: 160 }),
        Triglycerides: faker.number.int({ min: 50, max: 200 })
      };
    case 'TSH':
      return faker.number.float({ min: 0.4, max: 4.5, fractionDigits: 2 });
    case 'HBA1C':
      return faker.number.float({ min: 4.0, max: 10.0, fractionDigits: 1 });
    default:
      return faker.number.float({ min: 0, max: 100, fractionDigits: 1 });
  }
}

function getTestUnit(testCode) {
  const units = {
    'CBC': 'cells/μL',
    'BMP': 'mg/dL',
    'LIPID': 'mg/dL',
    'TSH': 'mIU/L',
    'HBA1C': '%',
    'PT/INR': 'seconds',
    'UA': 'cells/hpf'
  };
  return units[testCode] || 'units';
}

function getReferenceRange(testCode) {
  const ranges = {
    'TSH': '0.4-4.5 mIU/L',
    'HBA1C': '< 5.7%',
    'PT/INR': '11-13 seconds',
    'CBC': 'See individual components',
    'BMP': 'See individual components',
    'LIPID': 'See individual components'
  };
  return ranges[testCode] || 'Within normal limits';
}

// Main function to generate all demo data
async function generateDemoData() {
  console.log('🧪 Generating demo data for LabFlow...');
  
  const patients = generatePatients(100);
  console.log(`✅ Generated ${patients.length} patients`);
  
  const orders = generateTestOrders(patients, 500);
  console.log(`✅ Generated ${orders.length} test orders`);
  
  const results = generateResults(orders);
  console.log(`✅ Generated ${results.length} test results`);
  
  const demoData = {
    patients,
    orders,
    results,
    testCatalog: testCodes,
    metadata: {
      generatedAt: new Date().toISOString(),
      counts: {
        patients: patients.length,
        orders: orders.length,
        results: results.length,
        tests: testCodes.length
      }
    }
  };
  
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'demo.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(demoData, null, 2));
  
  console.log(`✅ Demo data saved to ${outputPath}`);
  console.log('\n📊 Summary:');
  console.log(`   - Patients: ${patients.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Results: ${results.length}`);
  console.log(`   - Test Types: ${testCodes.length}`);
}

// Run the generator
generateDemoData().catch(console.error);