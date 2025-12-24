
import axios from 'axios';

// Mock Config mimicking the Agent's environment
const CONTROLLER_URL = 'http://localhost:3000';
const NODE_ID = '6e8a5ae5-af28-4db2-b2f4-b8e34963a7ba';
const API_KEY = '0fa83474-e91c-408a-81e1-7d91cf335d4c';

async function simulateCrash() {
  console.log('>>> SIMULATING SERVER CRASH REPORT <<<');

  // 1. EULA Case
  console.log('--- Case 1: EULA Error ---');
  await sendReport({
      containerId: 'mock-minecraft-1',
      containerName: 'minecraft-server-uuid',
      exitCode: '1',
      logs: `
      [Server thread/INFO]: Starting minecraft server version 1.20.1
      [Server thread/INFO]: Loading properties
      [Server thread/INFO]: Default game type: SURVIVAL
      [Server thread/INFO]: Generating keypair
      [Server thread/INFO]: Starting Minecraft server on *:25565
      [Server thread/INFO]: Using default channel type
      [Server thread/WARN]: Failed to load eula.txt
      [Server thread/INFO]: You need to agree to the EULA in order to run the server. Go to eula.txt for more info.
      [Server thread/INFO]: Stopping server
      `
  });

  // 2. Segfault Case
  console.log('--- Case 2: Segmentation Fault ---');
  await sendReport({
    containerId: 'mock-rust-1',
    containerName: 'rust-server-uuid',
    exitCode: '139',
    logs: `
    Loading Prefabs...
    World Init...
    /entrypoint.sh: line 14:  1234 Segmentation fault      ./RustDedicated -batchmode
    `
  });
}

async function sendReport(data: any) {
    try {
        const res = await axios.post(`${CONTROLLER_URL}/ai/report`, data, {
            headers: { 'x-node-id': NODE_ID, 'x-api-key': API_KEY }
        });
        console.log('Response:', res.data);
    } catch (e: any) {
        console.error('Error:', e.response?.data || e.message);
    }
}

simulateCrash();
