import https from 'https';

const baseUrl = 'https://labsystem-a1.web.app';
const adminPages = [
  { path: '/admin', name: 'Admin Dashboard' },
  { path: '/admin/users', name: 'User Management' },
  { path: '/admin/settings', name: 'System Settings' },
  { path: '/admin/tenants', name: 'Tenant Management' },
  { path: '/admin/audit-logs', name: 'Audit Logs' },
  { path: '/admin/system-config', name: 'System Configuration' },
  { path: '/settings', name: 'Settings Page' },
  { path: '/profile', name: 'User Profile' },
  { path: '/quality-control', name: 'Quality Control' },
  { path: '/admin/roles', name: 'Role Management' },
  { path: '/admin/permissions', name: 'Permissions' },
  { path: '/admin/integrations', name: 'Integrations' }
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
        
        if (data.includes('console.error')) {
          results.errors.push('Page contains console.error calls');
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

async function verifyAdminPages() {
  console.log('LabFlow Admin Panel Verification');
  console.log('================================');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Checking ${adminPages.length} admin pages...`);
  
  const results = [];
  
  for (const page of adminPages) {
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
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n================================');
  console.log('SUMMARY');
  console.log('================================');
  
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const pagesWithErrors = results.filter(r => r.errors.length > 0).length;
  
  console.log(`Total admin pages checked: ${results.length}`);
  console.log(`Pages with errors: ${pagesWithErrors}`);
  console.log(`Total errors found: ${totalErrors}`);
  
  if (totalErrors === 0) {
    console.log('\n✅ All admin pages are loading without detected errors!');
  } else {
    console.log('\n❌ Some admin pages have errors that need attention.');
    console.log('\nPages with errors:');
    results.filter(r => r.errors.length > 0).forEach(r => {
      console.log(`\n${r.name} (${r.url}):`);
      r.errors.forEach(err => console.log(`  - ${err}`));
    });
  }
  
  // Also list all pages that are working correctly
  console.log('\n✅ Working pages:');
  results.filter(r => r.errors.length === 0).forEach(r => {
    console.log(`  - ${r.name}`);
  });
}

// Run the verification
verifyAdminPages().catch(console.error);