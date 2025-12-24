import axios from 'axios';

const CONTROLLER_URL = 'http://localhost:3000';
const INTERNAL_SECRET = 'c8dc1db2d58ed837884a119a3d48575aeabc8f09fa541e14ee5aa2103b5b7efb';
const TEST_USER_ID = 'audit-admin-uuid';

async function runExhaustiveAudit() {
    console.log('>>> INITIALIZING NEXUS USER-BASED FLEET AUDIT <<<');
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

            if (liveCount >= 6) {
                console.log('SUCCESS: TARGET REACHED.');
                return;
            }
        } catch (e: any) {
            console.warn('Monitor error:', e.message);
        }
    }

    console.log('TIMEOUT: AUDIT FAILED.');
    process.exit(1);
}

runExhaustiveAudit();
