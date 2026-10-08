// scripts/test-slot-panel.mjs
// Uji offline logika panel slot Neon (validasi, import massal, proteksi slot aktif).
// Jalankan: node scripts/test-slot-panel.mjs   (tidak butuh koneksi Neon sungguhan)
process.env.VERCEL = '1';              // data dir -> tmp, tidak mencemari repo
process.env.DB_PROBE_CONCURRENCY = '5';
delete process.env.DATABASE_URL; delete process.env.DATABASE_URLS; delete process.env.DATABASE_URLS_FILE;
for (let i=2;i<=20;i++) delete process.env['DATABASE_URL_'+i];

const pool = await import('../lib/dbPool.js');
const fs = await import('fs'); const os = await import('os'); const path = await import('path');
const cfgFile = path.join(os.tmpdir(),'bapperida-data','db_slots_config.json');
try { fs.unlinkSync(cfgFile); } catch {}

let pass=0, fail=0;
const ok=(c,m)=>{ if(c){pass++;console.log('  ✓',m)} else {fail++;console.log('  ✗ FAIL:',m)} };
const rejects=async(fn,status,m)=>{ try{ await fn(); fail++; console.log('  ✗ FAIL (tidak error):',m);}catch(e){ ok(e.status===status, `${m} → ${e.status}: ${e.message.slice(0,80)}`);} };
const U=(n,pw='npg_SECRETPASS123')=>`postgresql://neondb_owner:${pw}@ep-test-${n}-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`;

console.log('1) validateDbUrl');
ok(pool.validateDbUrl(U(1)).ok,'URL Neon valid');
ok(!pool.validateDbUrl('postgresql://u@ep-x.neon.tech/db').ok,'tanpa password ditolak');
ok(!pool.validateDbUrl('postgresql://u:p@evil.example.com/db').ok,'host non-neon ditolak (SSRF)');
ok(!pool.validateDbUrl('postgresql://u:p@127.0.0.1/db').ok,'localhost ditolak');
ok(!pool.validateDbUrl('postgresql://u:p@ep-x.neon.tech/').ok,'tanpa nama database ditolak');
ok(!pool.validateDbUrl('mysql://u:p@ep-x.neon.tech/db').ok,'protokol non-postgres ditolak');
ok(pool.validateDbUrl('postgresql://u:p@ep-x.us-east-2.aws.neon.tech/db').warnings.length===1,'non-pooler → peringatan');
ok(pool.validateDbUrl(`'${U(2)}'`).ok,'tanda kutip dibuang');

console.log('2) parseBulkInput');
const messy = `# komentar\n${U(1)}, ${U(2)}\nDATABASE_URLS="${U(3)}"\npsql '${U(4)}'\n["${U(5)}","${U(6)}"]\nsampah bukan url\n`;
const parsed = pool.parseBulkInput(messy);
ok(parsed.filter(e=>!e.error).length===6,'6 URL terdeteksi dari format campuran');
ok(parsed.filter(e=>e.error).length===1,'1 baris sampah dilaporkan');
await rejects(async()=>pool.parseBulkInput('x\n'.repeat(600)),400,'>500 baris ditolak');

console.log('3) pratinjau massal (dry run)');
const prev = await pool.previewBulkImport(`${U(1)}\n${U(2)}\n${U(2)}\nhttps://bukan.db\n${U(3)}`);
ok(prev.summary.added===3 && prev.summary.duplicate===1 && prev.summary.invalid===1,`added=3 dup=1 invalid=1 → ${JSON.stringify(prev.summary)}`);
ok(prev.results.filter(r=>r.status==='added').map(r=>r.slot).join()==='1,2,3','nomor otomatis 1,2,3');
ok((await pool.getSlotConfigView()).slots.every(s=>s.source==='empty'),'dry run tidak mengubah apa pun');

console.log('4) terapkan massal');
const ap = await pool.applyBulkImport(`${U(1)}\n${U(2)}\n${U(3)}`);
ok(ap.summary.added===3 && ap.version===1,'3 slot tersimpan, versi 1');
ok(fs.existsSync(cfgFile),'config tersimpan di file lokal');
let view = await pool.getSlotConfigView();
ok(view.slots[0].source==='panel' && view.slots[2].source==='panel' && view.slots[3].source==='empty','slot 1-3 terisi, 4 kosong');
ok(!JSON.stringify(view).includes('SECRETPASS'),'password TIDAK bocor di view');
ok(view.slots[0].connection.includes('****'),'URL disamarkan');
ok(view.poolSlots===3,'pool memuat 3 slot');
const again = await pool.applyBulkImport(`${U(1)}\n${U(2)}`);
ok(again.changed===false && again.summary.added===0,'paste ulang = idempoten (semua duplikat)');

console.log('5) satu per satu');
const one = await pool.upsertManagedSlot(10,{url:U(10),label:'Cadangan A',note:'uji'});
ok(one.created && one.number===10,'slot 10 dibuat');
await rejects(()=>pool.upsertManagedSlot(11,{url:U(10)}),409,'URL duplikat di slot lain ditolak');
await rejects(()=>pool.upsertManagedSlot(11,{}),400,'slot baru tanpa URL ditolak');
await rejects(()=>pool.upsertManagedSlot(101,{url:U(50)}),400,'nomor 101 ditolak');
await rejects(()=>pool.upsertManagedSlot(0,{url:U(50)}),400,'nomor 0 ditolak');
await rejects(()=>pool.upsertManagedSlot(11,{url:'postgresql://u:p@evil.com/db'}),400,'host non-neon ditolak');
const edit = await pool.upsertManagedSlot(10,{label:'Cadangan B'});
ok(!edit.created,'edit tanpa URL mempertahankan URL lama');
view = await pool.getSlotConfigView();
ok(view.slots[9].label==='Cadangan B' && view.slots[9].connection.includes('ep-test-10'),'label berubah, URL tetap');
await pool.upsertManagedSlot(10,{enabled:false});
view = await pool.getSlotConfigView();
ok(view.slots[9].enabled===false && view.slots[9].inPool===false,'slot nonaktif keluar dari pool');
ok(view.poolSlots===3,'pool tetap 3 slot');

console.log('6) optimistic lock');
await rejects(()=>pool.upsertManagedSlot(12,{url:U(12)},{expectedVersion:1}),409,'versi kedaluwarsa ditolak');

console.log('7) proteksi slot aktif');
const activeNo = view.activeSlot;
ok(activeNo!==null,`slot aktif = ${activeNo}`);
await rejects(()=>pool.removeManagedSlot(activeNo),409,'hapus slot aktif ditolak');
await rejects(()=>pool.upsertManagedSlot(activeNo,{enabled:false}),409,'nonaktifkan slot aktif ditolak');
await rejects(()=>pool.upsertManagedSlot(activeNo,{url:U(77)}),409,'ganti URL slot aktif ditolak');

console.log('8) hapus & mode replace');
const nonActive = [1,2,3].find(n=>n!==activeNo);
await pool.removeManagedSlot(nonActive);
await rejects(()=>pool.removeManagedSlot(nonActive),404,'hapus slot kosong → 404');
const rp = await pool.applyBulkImport(`${U(21)}\n${U(22)}`,{mode:'replace'});
view = await pool.getSlotConfigView();
const filled = view.slots.filter(s=>s.source==='panel').map(s=>s.number);
ok(filled.includes(activeNo),'replace mempertahankan slot aktif');
ok(rp.summary.added===2 && view.slots.filter(s=>s.source==='panel').length===3,`replace: aktif + 2 baru → ${filled}`);
ok(!JSON.stringify(view).includes('SECRETPASS'),'password tetap tidak bocor');

console.log('9) config tidak ikut dump data');
ok(pool.SLOT_CONFIG_KEY==='__db_slots_config','key config diketahui untuk dikecualikan');

console.log('10) slot ENV terkunci');
process.env.DATABASE_URL = U(900,'ENVPASS_999');
await rejects(()=>pool.upsertManagedSlot(1,{url:U(5)}),409,'slot 1 (ENV) terkunci');
// env ada → anchor = DB ENV yang tidak terjangkau → simpan harus gagal & config tidak berubah
const vBefore = (await pool.getSlotConfigView()).version;
await rejects(()=>pool.upsertManagedSlot(30,{url:U(30)}),502,'gagal simpan ke jangkar ENV → 502');
ok((await pool.getSlotConfigView()).version===vBefore,'config tidak berubah saat simpan gagal');

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail?1:0);
