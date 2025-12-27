import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'insecure-secret';

async function main() {
    console.log('>>> Starting Deployment Simulation (Internal Mode)...');

    const headers = { 
        'x-internal-secret': INTERNAL_SECRET 
    };

    // 1. Get Games
    console.log('[Catalog] Fetching games...');
    const gamesRes = await axios.get(`${API_URL}/games`, { headers });
    const games = gamesRes.data;
    console.log(`[Catalog] Found ${games.length} games.`);

    const userId = `sim_user_${uuidv4()}`;
    console.log(`[Identity] Simulating User ID: ${userId}`);

    // 2. Simulate Deployment Loop
    for (const game of games) {
        console.log(`\n--- Deploying ${game.name} (${game.id}) ---`);
        
        try {
            const deployRes = await axios.post(`${API_URL}/servers`, {
                userId,
                gameType: game.id,
                memoryLimitMb: 2048, 
                location: 'Sydney',
                autoUpdate: false // Speed up test
            }, { headers });

            const serverId = deployRes.data.serverId;
            console.log(`[Deploy] Initiated. Server ID: ${serverId}`);

            // Poll for status
            let status = 'PROVISIONING';
            let attempts = 0;
            while (status !== 'LIVE' && status !== 'FAILED' && attempts < 60) {
                await new Promise(r => setTimeout(r, 2000));
                const serverRes = await axios.get(`${API_URL}/servers/${serverId}`, { headers });
                status = serverRes.data.status;
                const progress = serverRes.data.progress || 0;
                process.stdout.write(`\r[Status] ${status} (${progress}%) - ${attempts * 2}s`);
                attempts++;
            }
            console.log(''); 

            if (status === 'LIVE') {
                console.log(`[Success] ${game.name} is LIVE!`);
                
                // Verify Logs
                const logsRes = await axios.post(`${API_URL}/commands/exec/${serverId}`, { command: 'echo "Health Check"' }, { headers });
                console.log(`[Verification] Health Check: ${logsRes ? 'OK' : 'No Response'}`);

                // Cleanup
                await axios.delete(`${API_URL}/servers/${serverId}`, { headers });
                console.log(`[Cleanup] Deleted ${serverId}`);
            } else {
                console.error(`[Failure] ${game.name} stuck at ${status}`);
                // Cleanup anyway
                await axios.delete(`${API_URL}/servers/${serverId}`, { headers });
            }

        } catch (e: any) {
            console.error(`[Error] Deployment failed for ${game.id}: ${e.response?.data?.message || e.message}`);
        }
    }

    console.log('\n>>> Simulation Complete.');
}

main();