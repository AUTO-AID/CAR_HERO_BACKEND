const axios = require('axios');

async function testUsersApi() {
  try {
    console.log('\n2. Fetching /api/v1/admin/users...');
    const usersRes = await axios.get('http://localhost:3001/api/v1/admin/users');
    
    console.log('✅ Response Status:', usersRes.status);
    console.log('✅ Response Data Keys:', Object.keys(usersRes.data));
    if (usersRes.data.meta) {
      console.log('✅ Meta Data:', usersRes.data.meta);
    }
    if (usersRes.data.data) {
      console.log(`✅ Data Array Length: ${usersRes.data.data.length}`);
      if (usersRes.data.data.length > 0) {
        console.log('Sample User:', usersRes.data.data[0].fullName || usersRes.data.data[0].phone);
      }
    } else {
      console.log('⚠️ Response data does not have a "data" array. Full Response:', JSON.stringify(usersRes.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.response ? error.response.status : error.message);
    if (error.response) {
      console.error('Response body:', error.response.data);
    }
  }
}

testUsersApi();
  } catch (error) {
    console.error('❌ Error testing API:', error.response ? error.response.status : error.message);
    if (error.response) {
      console.error('Response body:', error.response.data);
    }
  }
}

testUsersApi();
