
import axios from 'axios';

const CONTROLLER_URL = 'http://localhost:3000';
const INTERNAL_SECRET = 'c8dc1db2d58ed837884a119a3d48575aeabc8f09fa541e14ee5aa2103b5b7efb';

async function testDeployment() {
    console.log('>>> INITIALIZING TEST DEPLOYMENT (Minecraft)...');
    
    try {
        const res = await axios.post(`${CONTROLLER_URL}/servers`, {
            userId: 'test-admin-uuid',
            gameType: 'minecraft',
            memoryLimitMb: 2048,
            serverName: 'Nexus-Test-Server',
            env: ['EULA=TRUE', 'VERSION=1.20.1'],
            location: 'Sydney'
        }, {
            headers: { 'x-internal-secret': INTERNAL_SECRET }
        });

        console.log('Response:', res.data);
        const serverId = res.data.serverId || 'waiting-for-queue';
        console.log(`Server ID: ${serverId}`);

        console.log('>>> MONITORING PROVISIONING STATUS (60s)...');
        for (let i = 0; i < 12; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await axios.get(`${CONTROLLER_URL}/servers`, {
                headers: { 'x-internal-secret': INTERNAL_SECRET }
            });
            const server = statusRes.data.find((s: any) => s.name === 'Nexus-Test-Server');
            if (server) {
                console.log(`[T+${(i+1)*5}s] Status: ${server.status} | Progress: ${server.progress}% | Endpoint: ${server.subdomain || 'N/A'}`);
                if (server.status === 'LIVE' || server.status === 'RUNNING') {
                    console.log('✅ DEPLOYMENT SUCCESSFUL!');
                    return;
                }
            }
        }
    } catch (e: any) {
        console.error('❌ TEST FAILED:', e.response?.data || e.message);
    }
}

testDeployment();
