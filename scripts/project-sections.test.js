import test from 'node:test';
import assert from 'node:assert/strict';
import { sectionTypes, sectionLayouts, makeSection, validateSectionLayout, moveSection, projectFromForm, validatePreviewProject, updatePreviewText } from '../src/lib/studio/project-sections.js';

const section = (type = 'introduction', suffix = 'one') => makeSection(type, 'section-' + suffix);

test('all twelve approved sections have supported reusable layout defaults', () => {
 assert.equal(sectionTypes.length, 12);
 assert.equal(sectionLayouts.length, 9);
 for (const definition of sectionTypes) {
  const made = section(definition.type);
  assert.equal(made.heading, definition.label);
  assert(sectionLayouts.some(layout => layout.value === made.layout));
  assert.deepEqual(validateSectionLayout({version:1,sections:[made]}).sections[0], made);
 }
 assert.throws(() => makeSection('script', 'section-one'));
});

test('section editing and reordering preserve content without mutating the old order', () => {
 const first = section(), second = section('storyboard', 'two');
 second.description = 'A storyboard description.';
 const original = [first, second];
 const moved = moveSection(original, 1, -1);
 assert.equal(original[0].id, first.id);
 assert.equal(moved[0].description, second.description);
 assert.equal(moveSection(original, 0, -1), original);
 assert.equal(moveSection(original, 1, 1), original);
 assert.equal(moved.filter(item => item.id !== first.id).length, 1);
});

test('validation rejects unsupported layouts, excess content, duplicate IDs and all premature media paths', () => {
 const valid = section();
 for (const value of [
  {version:2,sections:[]}, {version:1,sections:Array(25).fill(valid)},
  {version:1,sections:[valid, valid]},
  {version:1,sections:[{...valid,type:'arbitrary-html'}]},
  {version:1,sections:[{...valid,layout:'custom-css'}]},
  {version:1,sections:[{...valid,heading:'x'.repeat(161)}]},
  {version:1,sections:[{...valid,media:[{src:'/projects/usa-valentines/private.png'}]}]},
  {version:1,sections:[{...valid,media:[{src:'https://untrusted.example/image.png'}]}]}
 ]) assert.throws(() => validateSectionLayout(value));
});

test('preview contains only allowed fields, keeps plain text and never accepts a supplied cover URL', () => {
 const form = new FormData();
 form.set('title', 'My new project'); form.set('type', 'portrait');
 form.set('roles', 'Design\n Illustration'); form.set('tools', 'Procreate');
 form.set('description', '<script>must remain plain text</script>');
 form.set('body', 'Existing body text remains in the preview.');
 const project = projectFromForm(form, [section()]);
 assert.equal(project.title, 'My new project');
 assert.equal(project.body, 'Existing body text remains in the preview.');
 assert.deepEqual(project.roles, ['Design','Illustration']);
 assert.equal(project.format, 'portrait');
 assert.equal(project.description, '<script>must remain plain text</script>');
 const parsed = validatePreviewProject({...project,cover:'/projects/usa-valentines/private.png',databasePassword:'must not survive'});
 assert.equal(parsed.cover, '');
 assert.equal(parsed.databasePassword, undefined);
 assert.throws(() => validatePreviewProject({...project,title:'x'.repeat(161)}));
});

test('inline edits update approved text fields only and preserve unfinished role lines', () => {
 const form = new FormData();form.set('title','A project');
 const project = projectFromForm(form,[section()]);
 const edited = updatePreviewText(project,{target:'section',id:'section-one',field:'description',value:'My revised description.'});
 assert.equal(edited.layout.sections[0].description,'My revised description.');
 assert.equal(project.layout.sections[0].description,'');
 const roles = updatePreviewText(project,{target:'project',field:'roles',value:'Illustration\n'});
 assert.deepEqual(roles.roles,['Illustration','']);
 const item = {src:'/images/example.png',kind:'image',ratio:1,alt:'An illustration',caption:''};
 const withMedia = structuredClone(project);
 withMedia.layout.sections[0].media = [item];
 const caption = updatePreviewText(withMedia,{target:'caption',id:'section-one',index:0,value:'Revised caption'},[{src:item.src,kind:item.kind}]);
 assert.equal(caption.layout.sections[0].media[0].caption,'Revised caption');
 assert.equal(caption.layout.sections[0].media[0].src,item.src);
 for (const action of [
  {target:'project',field:'cover',value:'/private.png'},
  {target:'section',id:'section-one',field:'layout',value:'custom'},
  {target:'section',id:'section-missing',field:'heading',value:'Missing'},
  {target:'project',field:'title',value:'x'.repeat(161)},
  {target:'project',field:'roles',value:Array(21).fill('Role').join('\n')},
  {target:'caption',id:'section-one',index:0,value:'No media'}
 ]) assert.throws(()=>updatePreviewText(project,action));
});
