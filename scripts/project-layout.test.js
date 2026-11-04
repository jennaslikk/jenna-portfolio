import test from 'node:test';
import assert from 'node:assert/strict';
import {generateProjectLayout, layoutFailureMessage} from '../src/lib/server/openrouter.js';
import {validateLayoutResponse,layoutToDraft} from '../src/lib/studio/layout-response.js';
import {validateSectionLayout} from '../src/lib/studio/project-sections.js';
import {isPublicMediaPath} from '../src/lib/studio/media-paths.js';
import {readProjectBrief} from '../src/lib/studio/project-brief.js';
const section={type:'storyboard',heading:'Storyboard',description:'',text:'',layout:'storyboard',materials:['Add the storyboard if one was produced.']};
const layout={intro:'An illustrated animation project.',format:'portrait',sections:[section,{...section,type:'video-showcase',heading:'Opening film',layout:'vertical-video'}],questions:['What animation tools did you use?']};

test('layout request reuses endpoint/model, sends only text, requires JSON and makes exactly one request',async()=>{
 let calls=0;
 const input=new FormData();
 input.set('title','Animation');input.set('description','I illustrated a short vertical film.');
 input.append('category','Motion Graphics');input.append('category','Illustration');
 const brief=readProjectBrief(input);
 assert.deepEqual(brief.category,['Motion Graphics','Illustration']);
 const result=await generateProjectLayout(brief,{apiKey:'test-only-not-real',model:'configured-model',fetcher:async(url,options)=>{
  calls++;assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');const body=JSON.parse(options.body);
  assert.equal(body.model,'configured-model');assert.equal(body.response_format.type,'json_schema');assert.equal(body.provider.require_parameters,true);assert.equal(body.provider.data_collection,'deny');
  // Provider compatibility must not depend on unsupported length/count constraints.
  const schemaText=JSON.stringify(body.response_format.json_schema.schema);
  for(const keyword of ['maxLength','minLength','maxItems','minItems'])assert(!schemaText.includes(`"${keyword}"`));
  assert.deepEqual(JSON.parse(body.messages[1].content),brief);assert(!options.body.includes('image_url'));
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(layout)}}]})};
 }});
 assert.equal(calls,1);assert.deepEqual(result,layout);
 const draft=layoutToDraft(result,brief.title);assert.equal(draft.project.title,brief.title);assert.equal(draft.project.client,'');assert.equal(draft.project.tools.length,0);assert.equal(draft.questions.length,1);assert.equal(draft.project.questions,undefined);assert.equal(draft.project.layout.sections[0].materials,undefined);
});

test('project brief requires approved categories and deduplicates repeated choices',()=>{
 const input=new FormData();input.set('title','Project');input.set('description','An illustrated animation.');
 assert.throws(()=>readProjectBrief(input),/at least one category/);
 input.append('category','Illustration');input.append('category','Illustration');
 assert.deepEqual(readProjectBrief(input).category,['Illustration']);
 input.append('category','Unknown category');assert.throws(()=>readProjectBrief(input));
 input.delete('category');input.append('category',new Blob(['Illustration']),'category.txt');
 assert.throws(()=>readProjectBrief(input));
});

test('invalid/malicious schema, extra code and truncated output fail without invented fallback',async()=>{
 for(const bad of [{...layout,html:'<script>'},{...layout,sections:[{...section,type:'execute-code'},section]},{...layout,sections:[]},{...layout,questions:[{script:'bad'}]}])assert.throws(()=>validateLayoutResponse(bad));
 for(const result of [{ok:false},{ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:JSON.stringify(layout)}}]})},{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'not JSON'}}]})}])await assert.rejects(generateProjectLayout({title:'Project',description:'A brief.'},{apiKey:'test-only',fetcher:async()=>result}));
 let called=false;await assert.rejects(generateProjectLayout({title:'',description:''},{apiKey:'test-only',fetcher:async()=>{called=true}}));assert.equal(called,false);
});

test('local validation still enforces all limits removed from the provider schema',()=>{
 for(const bad of [
  {...layout,intro:'x'.repeat(501)},
  {...layout,sections:Array(13).fill(section)},
  {...layout,questions:Array(9).fill('Missing detail?')},
  {...layout,sections:[{...section,heading:'x'.repeat(161)},section]},
  {...layout,sections:[{...section,description:'x'.repeat(2001)},section]},
  {...layout,sections:[{...section,text:'x'.repeat(3001)},section]},
  {...layout,sections:[{...section,materials:Array(7).fill('Add material.')},section]},
  {...layout,sections:[{...section,materials:['x'.repeat(301)]},section]}
 ])assert.throws(()=>validateLayoutResponse(bad));
});

test('local media is selected only from an explicit public catalogue, with original proportions and plain captions',()=>{
 assert(isPublicMediaPath('/projects/fruity-pigs/storyboard.png'));
 for(const path of ['/projects/usa-valentines/cover.png','/projects/Berry Lovely/cover.png','https://untrusted.example/a.jpg','/images/../private.jpg','/images/a.svg'])assert(!isPublicMediaPath(path));
 const media={src:'/projects/fruity-pigs/storyboard.png',kind:'image',ratio:1.4,alt:'Storyboard',caption:'A <plain> caption.'};
 const withMedia={...section,id:'section-one',media:[media]};
 assert.throws(()=>validateSectionLayout({version:1,sections:[withMedia]}));
 const safe=validateSectionLayout({version:1,sections:[withMedia]},[{src:media.src,kind:'image'}]);
 assert.equal(safe.sections[0].media[0].ratio,1.4);assert.equal(safe.sections[0].media[0].caption,'A <plain> caption.');
});

test('layout errors distinguish provider status, timeout and invalid output without exposing upstream text',async()=>{
 const brief={title:'Project',description:'An illustrated film.'};
 const options={apiKey:'test-only-not-real'};
 for(const status of [400,401,402,403,404,422,429,502,503]){
  let calls=0;
  try{
   await generateProjectLayout(brief,{...options,fetcher:async()=>{calls++;return {ok:false,status,json:async()=>({error:{message:'PRIVATE PROVIDER TEXT'}})};}});
   assert.fail('Expected a provider failure');
  }catch(error){
   const message=layoutFailureMessage(error);
   assert(message.includes(`HTTP ${status}`));
   assert(!message.includes('PRIVATE PROVIDER TEXT'));
   assert(!message.includes(options.apiKey));
   assert(message.includes('existing draft have been kept'));
  }
  assert.equal(calls,1);
 }
 const cases=[
  [async()=>{throw Error('PRIVATE NETWORK TEXT');},'could not connect'],
  [async()=>({ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:'{}'}}]})}),'stopped before finishing'],
  [async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'not JSON'}}]})}),'unreadable'],
  [async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{}'}}]})}),'required project structure'],
  [async()=>({ok:true,json:async()=>({error:{code:429,message:'PRIVATE PROVIDER TEXT'}})}),'HTTP 429']
 ];
 for(const [fetcher,expected] of cases){
  await assert.rejects(generateProjectLayout(brief,{...options,fetcher}),error=>{
   const message=layoutFailureMessage(error);assert(message.includes(expected));assert(!message.includes('PRIVATE'));return true;
  });
 }
 await assert.rejects(generateProjectLayout(brief,{...options,timeoutMs:5,fetcher:(_, {signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted'))))}),error=>layoutFailureMessage(error).includes('timed out'));
 assert(!layoutFailureMessage(Error('PRIVATE ERROR')).includes('PRIVATE ERROR'));
});
