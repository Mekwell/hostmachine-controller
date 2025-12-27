
import axios from 'axios';

const API_URL = 'http://localhost:3000';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'insecure-secret';

async function main() {
    console.log(`>>> Testing POST /servers with Secret: ${INTERNAL_SECRET.substring(0, 5)}...`);

    const headers = { 
        'x-internal-secret': INTERNAL_SECRET,
        'Content-Type': 'application/json'
    };

    const payload = {
        userId: 'test_admin_user',
        gameType: 'minecraft-java',
        memoryLimitMb: 2048,
        location: 'Sydney'
    };

    try {
        console.log('Sending request...');
        const res = await axios.post(`${API_URL}/servers`, payload, { headers });
        console.log('>>> SUCCESS!');
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (e: any) {
        console.error('>>> FAILURE');
        console.error('Status:', e.response?.status);
        console.error('Status Text:', e.response?.statusText);
        console.error('Data:', JSON.stringify(e.response?.data, null, 2));
        
        if (!e.response) {
            console.error('Error Message:', e.message);
        }
    }
}

main();
