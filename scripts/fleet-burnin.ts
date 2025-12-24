
import axios from 'axios';

const CONTROLLER_URL = 'http://localhost:3000';
const INTERNAL_SECRET = 'c8dc1db2d58ed837884a119a3d48575aeabc8f09fa541e14ee5aa2103b5b7efb';

const TEST_UNITS = [
    { name: 'Minecraft-BurnIn', type: 'minecraft', ram: 2048, env: ['EULA=TRUE'] },
    { name: 'Terraria-BurnIn', type: 'terraria', ram: 1024, env: ['MAX_PLAYERS=8'] },
    { name: 'Valheim-BurnIn', type: 'vh', ram: 2048, env: ['PASSWORD=burnin123'] }
];

async function fleetBurnIn() {
    console.log('>>> INITIALIZING NEXUS FLEET BURN-IN TEST <<<');
    const deploymentResults = [];

    // 1. Trigger All Deployments
    for (const unit of TEST_UNITS) {
        console.log(`- Queueing ${unit.name} (${unit.type})...
`);
        try {
            const res = await axios.post(`${CONTROLLER_URL}/servers`, {
                userId: 'fleet-test-uuid',
                gameType: unit.type,
                memoryLimitMb: unit.ram,
                serverName: unit.name,
                env: unit.env,
                location: 'Sydney'
            }, {
                headers: { 'x-internal-secret': INTERNAL_SECRET }
            });
            console.log(`  [OK] Job queued for ${unit.name}
`);
            deploymentResults.push(unit.name);
        } catch (e: any) {
            console.error(`  [FAIL] Failed to queue ${unit.name}:`, e.message);
        }
    }

    // 2. Monitor for 2 Minutes
    console.log('\n>>> MONITORING CONCURRENT PROVISIONING (120s)...
');
    for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
            const res = await axios.get(`${CONTROLLER_URL}/servers`, {
                headers: { 'x-internal-secret': INTERNAL_SECRET }
            });
            
            const activeTestServers = res.data.filter((s: any) => deploymentResults.includes(s.name));
            console.log(`
[T+${(i+1)*5}s] Snapshot:
`);
            
            activeTestServers.forEach((s: any) => {
                console.log(`  - ${s.name}: ${s.status} [${s.progress}%] | CPU: ${s.cpuUsage}% | RAM: ${s.ramUsage}MB
`);
            });

            const allLive = activeTestServers.every((s: any) => s.status === 'LIVE' || s.status === 'RUNNING');
            if (allLive && activeTestServers.length === TEST_UNITS.length) {
                console.log('
✅ ALL UNITS OPERATIONAL. FLEET STABLE.
');
                return;
            }
        } catch (e: any) {
            console.warn('  [WARN] Polling failed:', e.message);
        }
    }

    console.log('
❌ BURN-IN TIMEOUT: Some units failed to reach LIVE status.
');
}

fleetBurnIn();
