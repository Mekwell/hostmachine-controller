import axios from 'axios';

const CONTROLLER_URL = 'http://localhost:3000';
const INTERNAL_SECRET = 'c8dc1db2d58ed837884a119a3d48575aeabc8f09fa541e14ee5aa2103b5b7efb';
const TEST_USER_ID = 'audit-admin-uuid';

const FLEET_MANIFEST = [
    { type: 'minecraft', ram: 2048, env: ['EULA=TRUE'] },
    { type: 'terraria', ram: 1024, env: ['MAX_PLAYERS=16'] },
    { type: 'vh', ram: 2048, env: ['PASSWORD=audit123'] },
    { type: 'sdtd', ram: 4096, env: ['WORLD_SIZE=4096'] },
    { type: 'ark', ram: 8192, env: ['MAP=TheIsland'] },
    { type: 'asa', ram: 16384, env: ['MAP=TheIsland_WP'] }
];

async function runExhaustiveAudit() {
    console.log('>>> INITIALIZING NEXUS USER-BASED FLEET AUDIT <<<');
    
    // 1. Monitor existing and new for this user
    console.log(`Monitoring all units for User: ${TEST_USER_ID}`);

    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        
        try {
            const res = await axios.get(`${CONTROLLER_URL}/servers?userId=${TEST_USER_ID}`, {
                headers: { 'x-internal-secret': INTERNAL_SECRET }
            });
            
            const auditServers = res.data as any[];
            console.log(`
[T+${(i+1)*5}s] User Fleet Snapshot (${auditServers.length} units):`);
            
            let liveCount = 0;
            auditServers.forEach((s: any) => {
                const isLive = s.status === 'LIVE' || s.status === 'RUNNING';
                if (isLive) liveCount++;
                console.log(`  > ${s.name.padEnd(15)} | ${s.gameType.padEnd(10)} | Status: ${s.status.padEnd(12)} | Progress: ${String(s.progress).padStart(3)}% | CPU: ${s.cpuUsage}%`);
            });

            if (liveCount >= FLEET_MANIFEST.length) {
                console.log('
✨ AUDIT TARGET REACHED. MINIMUM FLEET SIZE OPERATIONAL.');
                return;
            }
        } catch (e: any) {
            console.warn('  [!] Monitor error:', e.message);
        }
    }

    console.log('
❌ AUDIT TIMEOUT.');
    process.exit(1);
}

runExhaustiveAudit();