import { sectionTypes, sectionLayouts, makeSection, validatePreviewProject } from './project-sections.js';

// Keep the provider schema simple; enforce every size limit locally below.
// Gemini supports a subset of JSON Schema and may reject complex constraints.
const string = maxLength => ({type:'string',description:`Plain text, at most ${maxLength} characters.`});
export const layoutResponseSchema = {
 type:'object',additionalProperties:false,required:['intro','format','sections','questions'],
 properties:{
  intro:string(500),format:{type:'string',enum:['landscape','portrait']},
  sections:{type:'array',description:'Recommend 3–7 sections. At least 2 and at most 12 are allowed.',items:{type:'object',additionalProperties:false,required:['type','heading','description','text','layout','materials'],properties:{
   type:{type:'string',enum:sectionTypes.map(item=>item.type)},heading:string(160),description:string(2000),text:string(3000),layout:{type:'string',enum:sectionLayouts.map(item=>item.value)},materials:{type:'array',description:'At most 6 suggestions. An empty array is allowed.',items:string(300)}
  }}},questions:{type:'array',description:'At most 8 questions about missing facts. An empty array is allowed.',items:string(300)}
 }
};

export function validateLayoutResponse(value) {
 const text=(value,max)=>typeof value==='string'&&value.length<=max;
 const keys=(value,names)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===names.length&&names.every(name=>Object.hasOwn(value,name));
 if(!keys(value,['intro','format','sections','questions'])||!text(value.intro,500)||!['landscape','portrait'].includes(value.format)||!Array.isArray(value.sections)||value.sections.length<2||value.sections.length>12||!Array.isArray(value.questions)||value.questions.length>8||value.questions.some(q=>!text(q,300)))throw new Error('The AI returned an incomplete layout. Please try again.');
 for(const section of value.sections){
  if(!keys(section,['type','heading','description','text','layout','materials'])||!sectionTypes.some(t=>t.type===section.type)||!sectionLayouts.some(l=>l.value===section.layout)||!text(section.heading,160)||!text(section.description,2000)||!text(section.text,3000)||!Array.isArray(section.materials)||section.materials.length>6||section.materials.some(m=>!text(m,300)))throw new Error('The AI returned an unsupported section. Please try again.');
 }
 return value;
}

export function layoutToDraft(value, title) {
 const validated=validateLayoutResponse(value);
 const sections=validated.sections.map((section,index)=>({...makeSection(section.type,'section-ai-'+index),heading:section.heading,description:section.description,text:section.text,layout:section.layout}));
 return {
  project:validatePreviewProject({title,description:validated.intro,format:validated.format,client:'',year:'',context:'',summary:'',body:'',roles:[],tools:[],layout:{version:1,sections}}),
  questions:validated.questions,
  suggestions:Object.fromEntries(sections.map((section,index)=>[section.id,validated.sections[index].materials]))
 };
}
