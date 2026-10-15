import {buildWeek,replaceDay,weekPresets} from "./week-engine.mjs";
// This week is entirely fictional and never connects to an account or orders food.
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
const $=id=>document.getElementById(id),presets=weekPresets();
let settings={...presets[0].options},current=null,replacements=[];
const element=(tag,cls,text)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;return e;
};
function options(){return {budget:settings.budget,maxCalories:settings.maxCalories,
 minProtein:settings.minProtein,variety:settings.variety,goal:settings.goal};}
function redrawControls(){
 const ids={budget:"budget",calories:"maxCalories",protein:"minProtein",variety:"variety"};
 for(const [id,key] of Object.entries(ids))$(id).value=settings[key];
 $("budgetValue").textContent="¥"+settings.budget;
 $("caloriesValue").textContent=settings.maxCalories+" 千卡";
 $("proteinValue").textContent=settings.minProtein+" 克";
 $("varietyValue").textContent=settings.variety===0?"保持习惯":
   settings.variety>=80?"多尝尝不一样的":"偶尔换换口味";
}
function redrawPresets(active=-1){
 const box=$("presets");box.replaceChildren();
 for(let i=0;i<presets.length;i++){
  const b=element("button","preset",presets[i].name);b.type="button";
  b.setAttribute("aria-pressed",String(i===active));
  b.addEventListener("click",()=>{
   settings={...presets[i].options};replacements=[];current=buildWeek(menu,options());
   redrawControls();redrawPresets(i);show();
  });box.append(b);
 }
}
function makeDay(day,i){
 const item=element("article","day"),header=element("div","day-head");
 header.append(element("span","day-id",day.day),element("span","day-index","第 "+(i+1)+" 次午餐"));
 item.append(header,element("h3","",day.foods.join(" ＋ ")));
 const facts=element("div","meal-facts");
 for(const v of ["¥"+day.price.toFixed(0),Math.round(day.calories)+" 千卡",
   "蛋白质 "+day.protein.toFixed(0)+" 克"])facts.append(element("span","",v));
 item.append(facts);
 const foot=element("div","day-bottom");
 foot.append(element("span","badge","这天安排好啦"));
 const btn=element("button","swap","↺ 换一份");
 btn.type="button";btn.setAttribute("aria-label",day.day+"换一份");
 btn.addEventListener("click",()=>{
  const next=replaceDay(menu,current,i,options());
  if(next.status!=="ok"){$("saveStatus").textContent="这一天暂时没有其他符合条件的搭配。";return;}
  current=next;
  if(replacements.length<80)replacements.push(i);
  show(i);
 });
 foot.append(btn);item.append(foot);return item;
}
function show(focusDay=-1){
 const box=$("calendar"),sum=$("summary");box.replaceChildren();sum.replaceChildren();
 if(!current||current.status!=="ok"){
  const empty=element("div","empty");
  empty.append(element("strong","","暂时安排不出合适的一周"),
    element("p","","放宽一点预算或营养条件，再试着生成。"));
  box.append(empty);return;
 }
 for(const [label,value] of [
  ["七餐参考合计","¥"+current.total.toFixed(0)],
  ["不同搭配",current.uniqueMeals+" 种"],
  ["每餐最高预算","¥"+settings.budget]]) {
  const tile=element("div","stat");
  tile.append(element("strong","",value),element("span","",label));sum.append(tile);
 }
 current.days.forEach((day,i)=>box.append(makeDay(day,i)));
 if(focusDay>=0){
  const button=box.children[focusDay]?.querySelector("button");
  button?.focus({preventScroll:true});
 }
}
function regenerate(){
 replacements=[];current=buildWeek(menu,options());redrawControls();show();
}
function save(){
 try{
  const payload={version:1,settings,replacements:replacements.slice(0,80)};
  localStorage.setItem("mcdecision-week-demo",JSON.stringify(payload));
  $("saveStatus").textContent="已保存在这个浏览器里。下次打开，还能继续调整。";
 }catch{$("saveStatus").textContent="这个浏览器暂时不能保存，但你仍可下载一份清单。";}
}
function restore(){
 try{
  const raw=localStorage.getItem("mcdecision-week-demo");
  if(!raw||raw.length>7000)return;
  const saved=JSON.parse(raw);
  if(saved.version!==1||!saved.settings||!Array.isArray(saved.replacements)||saved.replacements.length>80)return;
  const s=saved.settings;
  if(!Number.isInteger(s.budget)||s.budget<20||s.budget>75||
    !Number.isInteger(s.maxCalories)||s.maxCalories<300||s.maxCalories>1200||
    !Number.isInteger(s.minProtein)||s.minProtein<0||s.minProtein>60||
    !Number.isInteger(s.variety)||s.variety<0||s.variety>100||
    !["balanced","save","light","protein"].includes(s.goal))return;
  if(saved.replacements.some(x=>!Number.isInteger(x)||x<0||x>6))return;
  settings={...s};current=buildWeek(menu,options());replacements=[];
  for(const index of saved.replacements){
   const next=replaceDay(menu,current,index,options());
   if(next.status!=="ok")break;
   current=next;replacements.push(index);
  }
  $("saveStatus").textContent="已找回上次留在这台设备里的安排。";
 }catch{ /* private browsing or invalid storage -> safe defaults */ }
}
$("regenerate").addEventListener("click",regenerate);
$("save").addEventListener("click",save);
$("export").addEventListener("click",()=>{
 if(current?.status!=="ok")return;
 const lines=["一周午餐灵感（虚构演示，不是真实菜单或营养建议）","参考总花费 ¥"+current.total.toFixed(0),"",
 ...current.days.map(day=>day.day+"："+day.foods.join(" + ")+" | ¥"+day.price+" | "+
   Math.round(day.calories)+" 千卡 | 蛋白质 "+day.protein+" 克"),
 "","本作品并非官方点餐服务，价格及营养仅供演示。"];
 const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download="我的一周午餐灵感.txt";link.click();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
 $("saveStatus").textContent="一周清单已准备好保存。";
});
$("clear").addEventListener("click",()=>{
 try{localStorage.removeItem("mcdecision-week-demo");$("saveStatus").textContent="已删除这台设备保存的安排。";}
 catch{$("saveStatus").textContent="这个浏览器暂时不能操作已保存的安排。";}
});
$("reset").addEventListener("click",()=>{
 settings={...presets[0].options};redrawPresets(0);regenerate();
});
for(const [id,key] of Object.entries({budget:"budget",calories:"maxCalories",protein:"minProtein",variety:"variety"})){
 $(id).addEventListener("input",()=>{
  settings[key]=Number($(id).value);redrawControls();
 });
 $(id).addEventListener("change",()=>{redrawPresets(-1);regenerate();});
}
restore();redrawControls();redrawPresets(-1);
if(!current)current=buildWeek(menu,options());
show();
