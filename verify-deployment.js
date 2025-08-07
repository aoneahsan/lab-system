import https from 'https';

const baseUrl = 'https://labsystem-a1.web.app';
const pagesToCheck = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/tests/orders?action=new', name: 'New Test Order' },
  { path: '/patients', name: 'Patients List' },
  { path: '/samples', name: 'Samples' },
  { path: '/results', name: 'Results' },
  { path: '/billing', name: 'Billing' },
  { path: '/inventory', name: 'Inventory' },
  { path: '/reports', name: 'Reports' }
];

async function checkPage(url, name) {
  return new Promise((resolve) => {
    console.log(`\nChecking ${name} at ${url}...`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const results = {
          name,
          url,
          statusCode: res.statusCode,
          errors: []
        };
        
        // Check status code
        if (res.statusCode !== 200) {
          results.errors.push(`HTTP status code: ${res.statusCode}`);
        }
        
        // Check for error indicators in HTML
        if (data.includes('Something went wrong')) {
          results.errors.push('Page contains "Something went wrong" error');
        }
        
        if (data.includes('Error boundary')) {
          results.errors.push('Page contains Error boundary message');
        }
        
        if (data.includes('Firebase: Error')) {
          results.errors.push('Page contains Firebase error');
        }
        
        // Check if page has proper React root
        if (!data.includes('id="root"')) {
          results.errors.push('Missing React root element');
        }
        
        resolve(results);
      });
    }).on('error', (err) => {
      resolve({
        name,
        url,
        statusCode: 0,
        errors: [`Request failed: ${err.message}`]
      });
    });
  });
}

async function verifyDeployment() {
  console.log('LabFlow Deployment Verification');
  console.log('================================');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Checking ${pagesToCheck.length} pages...`);
  
  const results = [];
  
  for (const page of pagesToCheck) {
    const url = `${baseUrl}${page.path}`;
    const result = await checkPage(url, page.name);
    results.push(result);
    
    // Report immediate results
    if (result.errors.length === 0) {
      console.log(`✅ ${result.name}: OK (${result.statusCode})`);
    } else {
      console.log(`❌ ${result.name}: ${result.errors.length} error(s)`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }
  }
  
  // Summary
  console.log('\n================================');
  console.log('SUMMARY');
  console.log('================================');
  
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const pagesWithErrors = results.filter(r => r.errors.length > 0).length;
  
  console.log(`Total pages checked: ${results.length}`);
  console.log(`Pages with errors: ${pagesWithErrors}`);
  console.log(`Total errors found: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n✅ All pages are loading without detected errors!');
  } else {
    console.log('\n❌ Some pages have errors that need attention.');
    console.log('\nPages with errors:');
    results.filter(r => r.errors.length > 0).forEach(r => {
      console.log(`\n${r.name} (${r.url}):`);
      r.errors.forEach(err => console.log(`  - ${err}`));
    });
  }
}

// Run the verification
verifyDeployment().catch(console.error);