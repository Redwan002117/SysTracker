const axios = require('axios');

async function testMachines() {
    try {
        const response = await axios.get('http://localhost:3001/api/machines');
        if (Array.isArray(response.data)) {
            console.log("Success: API returned an array of length", response.data.length);
        } else {
            console.error("Failure: API returned non-array:", response.data);
        }
    } catch (error) {
        console.error("Error calling API:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

testMachines();
