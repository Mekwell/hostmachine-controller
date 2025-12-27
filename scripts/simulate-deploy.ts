import axios from 'axios';

const API_URL = 'http://localhost:3000';
const USER_EMAIL = `sim_${Date.now()}@test.com`;
const USER_PASS = 'password123';

async function main() {
    console.log('>>> Starting Deployment Simulation...');

    // 1. Register User
    try {
        await axios.post(`${API_URL}/auth/register`, { email: USER_EMAIL, password: USER_PASS });
        console.log(`[Auth] Registered user: ${USER_EMAIL}`);
    } catch (e: any) {
        console.warn(`[Auth] Registration failed (maybe exists): ${e.message}`);
    }

    // 2. Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, { email: USER_EMAIL, password: USER_PASS });
    const token = loginRes.data.access_token;
    const userId = loginRes.data.user.id;
    console.log(`[Auth] Logged in. Token: ${token.substring(0, 10)}...`);

    const headers = { Authorization: `Bearer ${token}` };

    // 3. Get Games
    const gamesRes = await axios.get(`${API_URL}/games`, { headers });
    const games = gamesRes.data;
    console.log(`[Catalog] Found ${games.length} games.`);

    // 4. Simulate Deployment Loop
    for (const game of games) {
        // Skip Windows games if running on Linux controller without Windows nodes, but for now we try all
        console.log(`
--- Deploying ${game.name} (${game.id}) ---`);
        
        try {
            const deployRes = await axios.post(`${API_URL}/servers`, {
                userId,
                gameType: game.id,
                memoryLimitMb: 2048, // Budget Plan spec
                location: 'Sydney' // Assuming simulation node is Sydney
            }, { headers });

            const serverId = deployRes.data.serverId;
            console.log(`[Deploy] Initiated. Server ID: ${serverId}`);

            // Poll for status
            let status = 'PROVISIONING';
            let attempts = 0;
            while (status !== 'LIVE' && status !== 'FAILED' && attempts < 30) {
                await new Promise(r => setTimeout(r, 2000));
                const serverRes = await axios.get(`${API_URL}/servers/${serverId}`, { headers });
                status = serverRes.data.status;
                process.stdout.write(`\r[Status] ${status} (${attempts * 2}s)`);
                attempts++;
            }
            console.log(''); // Newline

            if (status === 'LIVE') {
                console.log(`[Success] ${game.name} is LIVE!`);
                // Cleanup
                await axios.delete(`${API_URL}/servers/${serverId}`, { headers });
                console.log(`[Cleanup] Deleted ${serverId}`);
            } else {
                console.error(`[Failure] ${game.name} stuck at ${status}`);
            }

        } catch (e: any) {
            console.error(`[Error] Deployment failed for ${game.id}: ${e.response?.data?.message || e.message}`);
        }
    }

    console.log('\n>>> Simulation Complete.');
}

main();