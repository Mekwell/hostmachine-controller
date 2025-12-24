
import axios from 'axios';

const CONTROLLER_URL = 'http://localhost:3000';
const INTERNAL_SECRET = 'c8dc1db2d58ed837884a119a3d48575aeabc8f09fa541e14ee5aa2103b5b7efb';

const FLEET_MANIFEST = [
    { name: 'Audit-Minecraft', type: 'minecraft', ram: 2048, env: ['EULA=TRUE'] },
    { name: 'Audit-Terraria', type: 'terraria', ram: 1024, env: ['MAX_PLAYERS=16'] },
    { name: 'Audit-Valheim', type: 'vh', ram: 2048, env: ['PASSWORD=audit123'] },
    { name: 'Audit-7D2D', type: 'sdtd', ram: 4096, env: ['WORLD_SIZE=4096'] },
    { name: 'Audit-ARK-ASE', type: 'ark', ram: 8192, env: ['MAP=TheIsland'] },
    { name: 'Audit-ARK-ASA', type: 'asa', ram: 16384, env: ['MAP=TheIsland_WP'] }
];

async function runExhaustiveAudit() {
    console.log('>>> INITIALIZING NEXUS FULL-SPECTRUM FLEET AUDIT <<<');
    const start = Date.now();
    const trackers: string[] = [];

    // 1. Concurrent Trigger
    console.log('Phase 1: Concurrent Triggering...');
    const queueStart = Date.now();
    for (const unit of FLEET_MANIFEST) {
        try {
            await axios.post(`${CONTROLLER_URL}/servers`, {
                userId: 'audit-admin-uuid',
                gameType: unit.type,
                memoryLimitMb: unit.ram,
                serverName: unit.name,
                env: unit.env,
                location: 'Sydney'
            }, {
                headers: { 'x-internal-secret': INTERNAL_SECRET }
            });
            console.log(`  [+] Queued: ${unit.name}`);
            trackers.push(unit.name);
        } catch (e: any) {
            console.error(`  [-] Failed to queue ${unit.name}:`, e.message);
        }
    }
    console.log(`Queueing Phase complete in ${Date.now() - queueStart}ms.\n`);

    // 2. Convergence Monitoring
    console.log('Phase 2: Convergence Monitoring (Up to 5 minutes)...');
    const monitorStart = Date.now();
    let fullyOperational = false;

    for (let i = 0; i < 60; i++) { // Poll every 5s for 5 mins
        await new Promise(r => setTimeout(r, 5000));
        
        try {
            const res = await axios.get(`${CONTROLLER_URL}/servers`, {
                headers: { 'x-internal-secret': INTERNAL_SECRET }
            });
            
            const auditServers = (res.data as any[]).filter((s: any) => trackers.includes(s.name));
            console.log(`
[T+${(i+1)*5}s] Global Convergence Snapshot:`);
            
            let liveCount = 0;
            auditServers.forEach((s: any) => {
                const isLive = s.status === 'LIVE' || s.status === 'RUNNING';
                if (isLive) liveCount++;
                console.log(`  > ${s.name.padEnd(15)} | Status: ${s.status.padEnd(12)} | Progress: ${String(s.progress).padStart(3)}% | RAM: ${String(s.ramUsage).padStart(5)}MB`);
            });

            if (liveCount === FLEET_MANIFEST.length) {
                console.log('\n✨ ALL UNITS CONVERGED. FLEET FULLY OPERATIONAL.');
                fullyOperational = true;
                break;
            }
        } catch (e: any) {
            console.warn('  [!] Connectivity blip during monitor:', e.message);
        }
    }

    const totalTime = Date.now() - start;
    console.log('\n>>> AUDIT SUMMARY <<<');
    console.log(`Total Audit Duration: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`Convergence Status: ${fullyOperational ? 'SUCCESS' : 'TIMEOUT / PARTIAL FAILURE'}`);
    
    if (!fullyOperational) {
        process.exit(1);
    }
}

runExhaustiveAudit();
