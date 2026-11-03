import test from 'node:test';
import assert from 'node:assert/strict';
import { getFontDetails } from '../src/lib/server/font-details.js';
const data = {id:'fraunces',family:'Fraunces',license:'OFL-1.1',weights:[400,700],styles:['normal','italic'],subsets:['latin','latin-ext'],version:'v38',unsafe:'discard'};
const response = value => ({ok:true,json:async()=>value});

test('fixed external endpoint, validated public data and 24-hour cache', async () => {
 let calls=0,time=100;
 const fetcher=async(url,options)=>{calls++;assert.equal(url,'https://api.fontsource.org/v1/fonts/fraunces');assert.equal(options.redirect,'error');assert(!options.headers.authorization);return response(data)};
 const options={cache:new Map(),now:()=>time};
 const first=await getFontDetails('fraunces',fetcher,options);
 assert.equal(first.unsafe,undefined);assert.equal(first.family,'Fraunces');
 assert.deepEqual(await getFontDetails('fraunces',fetcher,options),first);assert.equal(calls,1);
 time+=24*60*60*1000+1;await getFontDetails('fraunces',fetcher,options);assert.equal(calls,2);
});

test('unapproved font IDs cannot trigger external requests', async () => {
 let calls=0;
 for(const id of ['https://untrusted.example','trickster','../../.env','unknown'])await assert.rejects(getFontDetails(id,async()=>{calls++}));
 assert.equal(calls,0);
});

test('service errors and malformed metadata are not cached',async()=>{
 for(const value of [{...data,license:'commercial'},{...data,id:'other'},{...data,weights:['400']},{...data,subsets:['<script>']},{...data,styles:['untrusted']}]){
  const cache=new Map();await assert.rejects(getFontDetails('fraunces',async()=>response(value),{cache}));assert.equal(cache.size,0);
 }
 await assert.rejects(getFontDetails('fraunces',async()=>({ok:false}),{cache:new Map()}));
 await assert.rejects(getFontDetails('fraunces',async()=>({ok:true,json:async()=>{throw Error('Invalid JSON')}}),{cache:new Map()}));
});
