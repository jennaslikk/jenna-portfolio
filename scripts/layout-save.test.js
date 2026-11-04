import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { validateLayoutSave } from '../src/lib/studio/layout-save.js';
import { makeSection } from '../src/lib/studio/project-sections.js';

const catalogue = [{src:'/images/approved.png',kind:'image'}];
const input = () => ({key:randomUUID(),intent:'draft',brief:{title:'New project',description:'An illustrated project.',category:['Illustration','AI Creative']},project:{
 title:'New project',description:'An illustrated project.',year:'',client:'',context:'',summary:'Reviewed summary.',body:'',roles:[],tools:[],category:['Illustration','AI Creative'],format:'landscape',cover:'',layout:{version:1,sections:[makeSection('introduction','section-one')]}
}});

test('private drafts accept unfinished media, preserve categories and reviewed summary',()=>{
 const value = validateLayoutSave(input(),catalogue);
 assert.equal(value.status,'draft');assert.equal(value.project.summary,'Reviewed summary.');
 assert.deepEqual(value.project.category,['Illustration','AI Creative']);
});

test('publication requires explicit confirmation and a complete basic page',()=>{
 const draft = input();draft.intent='publish';
 assert.throws(()=>validateLayoutSave(draft,catalogue),/Confirm/);
 draft.confirmed=true;assert.throws(()=>validateLayoutSave(draft,catalogue),/cover image/);
 draft.project.cover=catalogue[0].src;
 assert.equal(validateLayoutSave(draft,catalogue).status,'published');
 draft.project.layout.sections.push(makeSection('image-gallery','section-two'));
 assert.throws(()=>validateLayoutSave(draft,catalogue),/placeholders/);
 draft.project.layout.sections[1].media=Array(3).fill({src:catalogue[0].src,kind:'image',ratio:1,alt:'Illustration',caption:''});
 assert.equal(validateLayoutSave(draft,catalogue).project.layout.sections.length,2);
});

test('save validation rejects unapproved media, invalid categories, private titles and malformed keys',()=>{
 for(const change of [
  value=>{value.key='-'.repeat(36);},
  value=>{value.project.category=['Unknown'];},
  value=>{value.project.title='Berry Lovely';},
  value=>{value.project.cover='/projects/usa-valentines/cover.png';},
  value=>{value.project.cover='https://untrusted.example/image.png';},
  value=>{value.project.layout.sections[0].media=[{src:catalogue[0].src,kind:'image',ratio:0,alt:'',caption:''}];}
 ]){const value=input();change(value);assert.throws(()=>validateLayoutSave(value,catalogue));}
});
