import { buildChoiceMap,compareChoices } from "./map-engine.mjs";
const menu=[
{id:"a",name:"香煎鸡肉堡",calories:360,protein:24,price:22},
{id:"b",name:"玉米小杯",calories:90,protein:3,price:10},
{id:"c",name:"牛肉堡",calories:410,protein:22,price:23},
{id:"d",name:"田园沙拉",calories:60,protein:2,price:12},
{id:"e",name:"无糖饮品",calories:0,protein:0,price:9},
{id:"f",name:"烤鸡卷",calories:320,protein:20,price:20},
{id:"g",name:"酸奶",calories:130,protein:8,price:12},
{id:"h",name:"鸡蛋三明治",calories:280,protein:16,price:18}
];
const $=id=>document.getElementById(id),ns="http://www.w3.org/2000/svg";
const el=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e};
const svg=(tag,attrs={},content)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(content!==undefined)e.textContent=content;return e;};
const prefs={budget:45,calories:750,protein:15,maxItems:1};
let showAll=false,selected=[],result=null;
function syncInputs(){
 for(const id of ["budget","calories","protein"])$(id).value=prefs[id];
 $("budgetValue").textContent="¥"+prefs.budget;
 $("caloriesValue").textContent=prefs.calories+" 千卡";
 $("proteinValue").textContent=prefs.protein+" 克";
 document.querySelectorAll("[data-mode]").forEach(b=>
  b.setAttribute("aria-pressed",String(Number(b.dataset.mode)===prefs.maxItems)));
 $("allChoices").checked=showAll;
}
function addPick(id){
 if(selected.includes(id))selected=selected.filter(x=>x!==id);
 else selected=[...selected.slice(-1),id];
 paint();
 const chosen=selected.at(-1);
 const again=[...document.querySelectorAll("#choiceList button")].find(x=>x.dataset.choiceId===chosen);
 again?.focus({preventScroll:true});
}
function plot(choices){
 const space=$("plot");space.replaceChildren();
 const margin={left:53,right:22,top:25,bottom:46},width=660-margin.left-margin.right,height=370-margin.top-margin.bottom;
 for(let n=0;n<=4;n++){
  const y=margin.top+n*height/4;
  space.append(svg("line",{x1:margin.left,y1:y,x2:margin.left+width,y2:y,stroke:"#e2e8df","stroke-width":1}));
  const kcal=Math.round(prefs.calories*n/4);
  space.append(svg("text",{x:margin.left-12,y:y+4,"text-anchor":"end","font-size":11,fill:"#818a7d"},String(kcal)));
 }
 for(let n=0;n<=4;n++){
  const x=margin.left+n*width/4;
  space.append(svg("line",{x1:x,y1:margin.top,x2:x,y2:margin.top+height,stroke:"#e2e8df","stroke-width":1}));
  space.append(svg("text",{x,y:margin.top+height+20,"text-anchor":"middle","font-size":11,fill:"#818a7d"},String(Math.round(prefs.budget*n/4))));
 }
 space.append(svg("text",{x:margin.left+width/2,y:364,"text-anchor":"middle","font-size":12,fill:"#5d685f"},"参考花费（元）"));
 const yLabel=svg("text",{x:14,y:margin.top+height/2,transform:"rotate(-90 14 "+(margin.top+height/2)+")",
  "text-anchor":"middle","font-size":12,fill:"#5d685f"},"热量（千卡）");
 space.append(yLabel);
 const positions=new Map();
 for(const choice of choices){
  const x=margin.left+width*Math.min(1,choice.price/Math.max(prefs.budget,1));
  const y=margin.top+height*Math.min(1,choice.calories/Math.max(prefs.calories,1));
  positions.set(choice.id,{x,y});
 }
 if(selected.length===2&&positions.has(selected[0])&&positions.has(selected[1])){
  const a=positions.get(selected[0]),b=positions.get(selected[1]);
  space.append(svg("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
   stroke:"#d9a328","stroke-width":3,"stroke-dasharray":"6 5"}));
 }
 for(const c of choices){
  const at=positions.get(c.id),on=selected.includes(c.id);
  const radius=8+Math.min(14,c.protein/3.5);
  const circle=svg("circle",{cx:at.x,cy:at.y,r:radius,
   fill:on?"#efba33":c.dominated?"#cfd5cd":"#2b7c55",
   stroke:on?"#8e6711":"#fff","stroke-width":on?4:2,opacity:c.dominated?0.67:0.91,
   tabindex:0,role:"button","aria-label":c.label+"，参考价"+c.price+"元，热量"+Math.round(c.calories)+"千卡，蛋白质"+c.protein+"克"});
  circle.style.cursor="pointer";
  circle.addEventListener("click",()=>addPick(c.id));
  circle.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();addPick(c.id)}});
  circle.append(svg("title",{},c.label+" · ¥"+c.price+" · "+Math.round(c.calories)+"千卡 · 蛋白质"+c.protein+"克"));
  space.append(circle);
 }
}
function paintComparison(){
 const slot=$("compare");slot.replaceChildren();
 if(!selected.length){
  slot.append(el("p","small-note","还没有选中搭配。先在图上或列表中挑第一份吧。"));return;
 }
 const pair=selected.map(id=>result.choices.find(x=>x.id===id)).filter(Boolean);
 const grid=el("div","comparison-items");
 for(const p of pair){
  const box=el("article");
  box.append(el("strong","",p.label),el("span","", "¥"+p.price+" · "+Math.round(p.calories)+" 千卡 · 蛋白质 "+p.protein+" 克"));
  grid.append(box);
 }
 slot.append(grid);
 if(pair.length===2){
  const d=compareChoices(pair[0],pair[1]);
  const text=(v,unit)=>v===0?"相同":v>0?"增加 "+Math.abs(v)+unit:"减少 "+Math.abs(v)+unit;
  slot.append(el("div","diff","第二份相对第一份：花费"+text(d.price," 元")+
   " · 热量"+text(d.calories," 千卡")+" · 蛋白质"+text(d.protein," 克")+
   "。你更看重哪个方向，由自己决定。"));
 }else slot.append(el("p","small-note","再选一份，就能对照它们的不同。"));
 const btn=el("button","clear-btn","清空对比");btn.addEventListener("click",()=>{selected=[];paint();});
 slot.append(btn);
}
function paint(){
 result=buildChoiceMap(menu,{budget:prefs.budget,maxCalories:prefs.calories,
  minProtein:prefs.protein,maxItems:prefs.maxItems});
 const stat=$("stats"),list=$("choiceList");stat.replaceChildren();list.replaceChildren();
 if(result.status!=="ok"){
  $("plot").replaceChildren();
  const empty=el("div","empty","当前条件下没有合适的搭配，试试调整预算或营养条件。");
  list.append(empty);selected=[];paintComparison();return;
 }
 selected=selected.filter(id=>result.choices.some(x=>x.id===id));
 const choices=showAll?result.choices:result.choices.filter(x=>!x.dominated);
 stat.append(el("span","pill",result.candidateCount+" 种符合条件"),
  el("span","pill",result.frontierSize+" 种各有优势"));
 plot(choices);
 for(const c of choices){
  const b=el("button","item");b.type="button";b.dataset.choiceId=c.id;
  b.setAttribute("aria-pressed",String(selected.includes(c.id)));
  b.append(el("strong","",c.label),el("span","", "¥"+c.price+" · "+Math.round(c.calories)+" 千卡 · 蛋白质 "+c.protein+" 克"));
  if(c.dominated)b.append(el("span","", "另有选择在几个方向上都不差"));
  b.addEventListener("click",()=>addPick(c.id));list.append(b);
 }
 paintComparison();
}
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{
 prefs.maxItems=Number(b.dataset.mode);selected=[];syncInputs();paint();
}));
for(const id of ["budget","calories","protein"])$(id).addEventListener("input",()=>{
 prefs[id]=Number($(id).value);selected=[];syncInputs();paint();
});
$("allChoices").addEventListener("change",()=>{showAll=$("allChoices").checked;selected=[];paint();});
syncInputs();paint();
