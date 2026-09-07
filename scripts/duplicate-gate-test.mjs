// Regression test for the duplicate-detection NAME GATE, built from the pairs
// that production actually got wrong.
//
// Every REJECT case below was flagged at 98-100 by the original scorer and is
// not a duplicate: two doctors sharing a hospital switchboard, two hospital
// departments, two franchise branches in different sectors, two diagnostic
// branches in different localities. Every FLAG case is a genuine duplicate the
// gate must not lose.
//
// This file exists because synthetic fixtures could never have caught the bug:
// planted duplicates ARE duplicates, so the scorer looked perfect on them
// while being unusable on real data.
//
// Run: node scripts/duplicate-gate-test.mjs
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const DB=process.env.GATETEST_DB||'postgres://postgres:pw@localhost:5599/gatetest'; const PORT=Number(process.env.GATETEST_PORT||5185); const BASE=`http://127.0.0.1:${PORT}`;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const L=(id,over)=>({id,name:'x',slug:id,status:'approved',localityId:'loc_1',areaId:'area_1',cityId:'c',stateId:'s',
  pincode:'400614',categoryId:'cat_health',subcategoryId:'sub_doctor',phone:'+91 98100 55555',
  address:'Apollo Hospitals, Plot 13, Parsik Hill Rd, Sector 23, CBD Belapur, Navi Mumbai, Maharashtra 400614, India',
  rating:4.9,reviewCount:10,createdAt:'2026-01-01T00:00:00.000Z',...over});

// The six real pairs, reproduced with their production names/addresses.
const PAIRS=[
 ['REJECT','doctors',       L('d1',{name:'Dr. Sanjay Khare',reviewCount:11}), L('d2',{name:'DR HARSHAD NIKTE'})],
 ['REJECT','departments',   L('e1',{name:'Department of Ophthalmology | Apollo Hospitals Mumbai',reviewCount:11}), L('e2',{name:'Department of Pediatrics | Apollo Hospitals Mumbai'})],
 ['REJECT','ayurveda docs', L('f1',{name:'Dr. Neema Mohan E. K. | Ayurveda Doctor',reviewCount:11}), L('f2',{name:'Dr. Adarsh Thaikkadath | Ayurveda Specialist | Navi Mumbai'})],
 ['REJECT','uclean',        L('g1',{name:'UClean Laundry | Dry Cleaning & Laundry Services | Sector 44, Navi Mumbai',pincode:'400706',address:'Shop No.1, Tirupati CHS, Seawoods West, Sector 44, Seawoods, Navi Mumbai, Maharashtra 400706, India',reviewCount:11}),
                            L('g2',{name:'UClean Laundry | Dry Cleaning & Laundry Services | Sector 6, Nerul',pincode:'400706',address:'shop no 1, Plot No, 219, Sector 6, Sarsole, Nerul, Navi Mumbai, Maharashtra 400706, India'})],
 ['REJECT','gomechanic',    L('h1',{name:'GoMechanic - Car Service & Repair Center',address:'Belapur Village, Sector 15, CBD Belapur, Navi Mumbai, Maharashtra 400614, India',reviewCount:11}),
                            L('h2',{name:'GoMechanic - Car Service Service | ECM Repair',address:'Shop no plot no.B-84, garage line, Belapur Village, Sector 20, CBD Belapur, Navi Mumbai, Maharashtra 400614, India'})],
 ['REJECT','torrent',       L('i1',{name:'Torrent Diagnostics Center In Nerul, Navi Mumbai - Blood Test Centre',reviewCount:72}),
                            L('i2',{name:'Torrent Diagnostics Center in Seawoods - Blood Test Centre',reviewCount:20})],
 ['FLAG','titan promo',     L('j1',{name:'Titan Eye+ at Belapur, Mumbai (Buy 1 Get 1 Free)',reviewCount:8}), L('j2',{name:'Titan Eye+ at Belapur, Mumbai',reviewCount:0})],
 ['FLAG','new brand',       L('k1',{name:'New Brand factory - Belapur',reviewCount:10}), L('k2',{name:'The New Brand Factory',reviewCount:2})],
 ['FLAG','pvt ltd suffix',  L('m1',{name:'Sharma Sweets Pvt Ltd',reviewCount:5}), L('m2',{name:'Sharma Sweets'})],
 // Same name, DIFFERENT address: franchises and facilities. The name gate
 // cannot see these, so the premise-number gate has to.
 ['REJECT','franchise partners', L('n1',{name:'Mirae Asset Sharekhan - Authorised Partner',address:'Shop 4, Plot 21, Sector 15, CBD Belapur, Navi Mumbai, Maharashtra 400614, India',reviewCount:11}),
                                 L('n2',{name:'Mirae Asset Sharekhan - Authorised Partner',address:'Office 2, Plot 8, Sector 30, CBD Belapur, Navi Mumbai, Maharashtra 400614, India'})],
 ['REJECT','two petrol pumps',   L('p1',{name:'Bharat Petroleum Corporation Ltd',address:'Plot 12, Sector 11, CBD Belapur, Navi Mumbai, Maharashtra 400614, India',reviewCount:11}),
                                 L('p2',{name:'Bharat Petroleum Corporation ltd',address:'Plot 40, Sector 26, CBD Belapur, Navi Mumbai, Maharashtra 400614, India'})],
 // Same name, SAME premises: a real duplicate must survive the premise gate.
 ['FLAG','true dup same premises', L('q1',{name:'Jhama Sweets',address:'Shop 3, Sector 15, CBD Belapur, Navi Mumbai, Maharashtra 400614, India',reviewCount:11}),
                                   L('q2',{name:'Jhama Sweets',address:'Shop 3, Sector 15, CBD Belapur, Navi Mumbai, Maharashtra 400614, India'})],
 // One address states a sector, the other does not: absence is not a conflict.
 ['FLAG','one address vaguer',   L('r1',{name:'Mukadam Printing Press',address:'Sector 15, CBD Belapur, Navi Mumbai, Maharashtra 400614, India',reviewCount:11}),
                                 L('r2',{name:'Mukadam Printing Press',address:'CBD Belapur, Navi Mumbai, Maharashtra 400614, India'})],
];

const server=spawn(process.execPath,['server.js'],{env:{...process.env,DATABASE_URL:DB,PORT:String(PORT),AUTH_SECRET:'g',BLOB_SNAPSHOT_INTERVAL_MS:'600000',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
let slog=''; server.stdout.on('data',c=>{slog+=c}); server.stderr.on('data',c=>{slog+=c});
try{
for(let i=0;i<80;i++){try{if((await fetch(`${BASE}/api/db-status`)).ok)break;}catch{} await sleep(500);}
const ch=await(await fetch(`${BASE}/api/auth/platform/request-otp`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:'admin@localsy.test',password:'Admin@12345'})})).json();
const lb=await(await fetch(`${BASE}/api/auth/verify-otp`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({challengeToken:ch.challengeToken,otp:ch.devOtp||'123456'})})).json();
const auth={'Content-Type':'application/json',Authorization:`Bearer ${lb.token}`};

const q=await(await fetch(`${BASE}/api/admin/imports`,{method:'POST',headers:auth,body:JSON.stringify({businesses:PAIRS.flatMap(p=>[p[2],p[3]]),label:'gate test'})})).json();
for(let i=0;i<80;i++){const j=(await(await fetch(`${BASE}/api/admin/imports/${q.jobId}`,{headers:auth})).json())?.job; if(j&&['completed','failed'].includes(j.status))break; await sleep(300);}

const queue=await(await fetch(`${BASE}/api/admin/directory-quality/duplicates?limit=100`,{headers:auth})).json();
const flaggedIds=new Set((queue.candidates||[]).flatMap(c=>[c.canonical.id,c.duplicate.id]));
let pass=0;
for(const [want,label,a,b] of PAIRS){
  const isFlagged=flaggedIds.has(a.id)||flaggedIds.has(b.id);
  const got=isFlagged?'FLAG':'REJECT';
  const ok=got===want; if(ok)pass++;
  console.log(`${ok?'ok  ':'FAIL'} ${want.padEnd(6)} ${label.padEnd(15)} -> ${got}`);
}
console.log(`\n${pass}/${PAIRS.length} correct   (queue reports ${queue.flaggedListings} pairs)`);
console.log(pass===PAIRS.length?'\nall gate checks passed':`\n${PAIRS.length-pass} gate check(s) failed`);
}finally{server.kill('SIGTERM');await once(server,'exit').catch(()=>{});}
process.exit(0);
