#!/usr/bin/env node

const https = require('https');
const http = require('http');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Make HTTP/HTTPS request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Format JSON output with color (if supported)
function formatJson(obj) {
  return JSON.stringify(obj, null, 2);
}

// Print section header
function printHeader(text) {
  console.log('\n' + '='.repeat(60));
  console.log(text);
  console.log('='.repeat(60));
}

// Main test function
async function testMobileAPI() {
  console.log('🧪 Harmony Mobile API Test Script\n');
  
  try {
    // Get connection code from user
    const connectionCode = await prompt('Enter connection code (e.g., E2F37TN9): ');
    if (!connectionCode.trim()) {
      console.error('❌ Connection code is required');
      rl.close();
      return;
    }
    
    // Get API URL from user (with default)
    const apiUrlInput = await prompt('Enter API URL [default: http://localhost:3001]: ');
    const apiUrl = apiUrlInput.trim() || 'http://localhost:3001';
    
    console.log(`\n📡 Using API URL: ${apiUrl}`);
    console.log(`🔑 Using connection code: ${connectionCode}\n`);
    
    // Step 1: Connect with code to get bearer token
    printHeader('Step 1: Getting Bearer Token');
    console.log(`POST ${apiUrl}/api/mobile/connect`);
    
    const connectResponse = await makeRequest(`${apiUrl}/api/mobile/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: connectionCode })
    });
    
    if (connectResponse.status !== 200) {
      console.error(`❌ Failed to connect: ${connectResponse.status}`);
      console.error(formatJson(connectResponse.data));
      rl.close();
      return;
    }
    
    console.log(`✅ Status: ${connectResponse.status}`);
    console.log('Response:', formatJson(connectResponse.data));
    
    const token = connectResponse.data.token;
    if (!token) {
      console.error('❌ No token received in response');
      rl.close();
      return;
    }
    
    console.log(`\n🎫 Bearer Token: ${token.substring(0, 20)}...`);
    
    // Authorization header for subsequent requests
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test /api/mobile/data/sample
    printHeader('Step 2: Testing /api/mobile/data/sample');
    console.log(`GET ${apiUrl}/api/mobile/data/sample`);
    
    const sampleResponse = await makeRequest(`${apiUrl}/api/mobile/data/sample`, {
      method: 'GET',
      headers: authHeaders
    });
    
    console.log(`Status: ${sampleResponse.status}`);
    if (sampleResponse.status === 200) {
      console.log('✅ Sample data retrieved successfully');
      console.log('Keys:', Object.keys(sampleResponse.data));
      console.log('\nSample (first 500 chars):', formatJson(sampleResponse.data).substring(0, 500) + '...');
    } else {
      console.error(`❌ Failed: ${sampleResponse.status}`);
      console.error(formatJson(sampleResponse.data));
    }
    
    // Step 3: Test /api/mobile/data/harmony-chats
    printHeader('Step 3: Testing /api/mobile/data/harmony-chats');
    console.log(`GET ${apiUrl}/api/mobile/data/harmony-chats`);
    
    const chatsResponse = await makeRequest(`${apiUrl}/api/mobile/data/harmony-chats`, {
      method: 'GET',
      headers: authHeaders
    });
    
    console.log(`Status: ${chatsResponse.status}`);
    if (chatsResponse.status === 200) {
      console.log('✅ Harmony chats retrieved successfully');
      console.log('Keys:', Object.keys(chatsResponse.data));
      if (chatsResponse.data.chatList) {
        console.log(`Chat count: ${chatsResponse.data.chatList.length}`);
      }
      console.log('\nSample (first 500 chars):', formatJson(chatsResponse.data).substring(0, 500) + '...');
    } else {
      console.error(`❌ Failed: ${chatsResponse.status}`);
      console.error(formatJson(chatsResponse.data));
    }
    
    // Step 4: Test /api/mobile/data/kpis
    printHeader('Step 4: Testing /api/mobile/data/kpis');
    console.log(`GET ${apiUrl}/api/mobile/data/kpis`);
    
    const kpisResponse = await makeRequest(`${apiUrl}/api/mobile/data/kpis`, {
      method: 'GET',
      headers: authHeaders
    });
    
    console.log(`Status: ${kpisResponse.status}`);
    if (kpisResponse.status === 200) {
      console.log('✅ KPI data retrieved successfully');
      console.log('Keys:', Object.keys(kpisResponse.data));
      console.log('\nSample (first 500 chars):', formatJson(kpisResponse.data).substring(0, 500) + '...');
    } else {
      console.error(`❌ Failed: ${kpisResponse.status}`);
      console.error(formatJson(kpisResponse.data));
    }
    
    // Summary
    printHeader('Test Summary');
    console.log(`✅ Connect: ${connectResponse.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Sample Data: ${sampleResponse.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Harmony Chats: ${chatsResponse.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ KPIs: ${kpisResponse.status === 200 ? 'PASS' : 'FAIL'}`);
    
    const allPassed = [connectResponse, sampleResponse, chatsResponse, kpisResponse]
      .every(r => r.status === 200);
    
    if (allPassed) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the output above for details.');
    }
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
  } finally {
    rl.close();
  }
}

// Run the test
testMobileAPI();
