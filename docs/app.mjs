import { optimize } from "./engine.mjs";
import { comparePlans, explainPlan, rescueConstraints } from "./lab.mjs";
// All food names and numbers on this page are deliberately fictional.
const foods=[
{id:"a",name:"香煎鸡肉堡",calories:360,protein:24,price:22},
{id:"b",name:"玉米小杯",calories:90,protein:3,price:10},
{id:"c",name:"牛肉堡",calories:410,protein:22,price:23},
{id:"d",name:"田园沙拉",calories:60,protein:2,price:12},
{id:"e",name:"无糖饮品",calories:0,protein:0,price:9},
{id:"f",name:"烤鸡卷",calories:320,protein:20,price:20},
{id:"g",name:"酸奶",calories:130,protein:8,price:12},
{id:"h",name:"鸡蛋三明治",calories:280,protein:16,price:18}
];
const $=id=>document.getElementById(id);
const defaultSettings={goal:"balanced",budget:45,calories:850,protein:25};
const settings={...defaultSettings};
const exclusions=new Set(),selected=new Map();
let expanded=false,lastResults=[],luckyKey=null;
const node=(tag,cls,content)=>{
 const el=document.createElement(tag);if(cls)el.className=cls;
 if(content!==undefined)el.textContent=content;return el;
};
function metric(label,value){
 const el=node("div","metric"),strong=node("strong","",value);
 el.append(strong,node("span","",label));return el;
}
function allPlans(){
 return optimize(foods,{goal:settings.goal,budget:settings.budget,
   maxCalories:settings.calories,minProtein:settings.protein,excludeIds:[...exclusions],limit:12});
}
function renderGoals(){
 document.querySelectorAll("[data-goal]").forEach(button=>
  button.setAttribute("aria-pressed",String(button.dataset.goal===settings.goal)));
}
function renderFilters(){
 const el=$("exclude");el.replaceChildren();
 for(const food of foods){
  const b=node("button","chip",food.name);b.type="button";b.setAttribute("aria-pressed",String(exclusions.has(food.id)));
  b.dataset.foodId=food.id;
  b.addEventListener("click",()=>{
   if(exclusions.has(food.id))exclusions.delete(food.id);else exclusions.add(food.id);
   selected.clear();expanded=false;luckyKey=null;render();
   const again=[...document.querySelectorAll("[data-food-id]")].find(x=>x.dataset.foodId===food.id);
   if(again)again.focus({preventScroll:true});
  });
  el.append(b);
 }
}
function comparePanel(){
 const panel=$("compare");const content=$("compareContent");content.replaceChildren();
 if(selected.size===0){panel.classList.add("hide");return;}
 panel.classList.remove("hide");
 const selectedPlans=[...selected.values()];
 const pair=node("div","compare-grid");
 for(const plan of selectedPlans){
  const tile=node("div","compare-tile");
  tile.append(node("strong","",plan.foods.join(" + ")),node("span","",
    "¥"+(plan.price===null?"未知":plan.price.toFixed(0))+
    " · "+Math.round(plan.calories)+" 千卡 · "+plan.protein.toFixed(1)+" 克蛋白质"));
  pair.append(tile);
 }
 content.append(pair);
 if(selectedPlans.length===2){
  const delta=comparePlans(selectedPlans[0],selectedPlans[1]);
  content.append(node("div","diff","第二份与第一份相比："+delta.narrative));
 }else content.append(node("p","", "再选一份，就能看到区别。"));
 const clear=node("button","text-button","清空对比");
 clear.type="button";clear.addEventListener("click",()=>{selected.clear();render();});
 content.append(clear);
}
function planCard(plan){
 const item=node("article","meal-card");
 const planKey=plan.foods.join("|");
 item.dataset.planKey=planKey;
 if(planKey===luckyKey){item.classList.add("is-picked");item.append(node("div","picked-label","🎉 好啦，就考虑这份！"));}
 const top=node("div","card-top");top.append(
  node("span","tag"+(plan.rank===1?" first":""),plan.rank===1?"✨ 优先推荐":"另一种好选择"),
  node("span","small","第 "+plan.rank+" 份"));
 item.append(top,node("h3","",plan.foods.join(" + ")));
 const figures=node("div","metrics");
 figures.append(metric("参考花费","¥"+(plan.price===null?"未知":plan.price.toFixed(0))),
   metric("热量",Math.round(plan.calories)+" 千卡"),metric("蛋白质",plan.protein.toFixed(1)+" 克"));
 item.append(figures);
 const why=node("div","why-lines");
 for(const f of explainPlan(plan,{budget:settings.budget,
   maxCalories:settings.calories,minProtein:settings.protein})){
  const p=node("div","why-line");p.append(node("span","",f.label),node("strong","",f.value));why.append(p);
 }
 item.append(why,node("p","reason","这份搭配满足你刚刚选的条件；可以和其他搭配比较，再决定。"));
 const actions=node("div","card-actions");
 const copy=node("button","text-button","↗ 复制这份搭配");
 copy.type="button";copy.addEventListener("click",async()=>{
  const words="【仅供演示】"+plan.foods.join(" + ")+"；参考花费 ¥"+plan.price+
     "；热量 "+Math.round(plan.calories)+" 千卡；蛋白质 "+plan.protein.toFixed(1)+" 克。";
  try{await navigator.clipboard.writeText(words);copy.textContent="✓ 已复制";}
  catch{copy.textContent="复制未成功，请再试一次";}
 });
 const choice=node("button","compare-button",selected.has(plan.foods.join("|"))?"✓ 已加入":"＋ 放进对比");
 choice.type="button";choice.setAttribute("aria-pressed",String(selected.has(plan.foods.join("|"))));
 choice.addEventListener("click",()=>{
  const key=plan.foods.join("|");
  if(selected.has(key))selected.delete(key);
  else {if(selected.size>=2)selected.delete(selected.keys().next().value);selected.set(key,plan);}
  render();
  const again=[...document.querySelectorAll(".meal-card")].find(x=>x.dataset.planKey===key);
  const control=again?.querySelector(".compare-button");if(control)control.focus({preventScroll:true});
 });
 actions.append(copy,choice);item.append(actions);return item;
}
function render(){
 $("budgetValue").textContent="¥"+settings.budget;
 $("caloriesValue").textContent=settings.calories+" 千卡";
 $("proteinValue").textContent=settings.protein+" 克";
 for(const id of ["budget","calories","protein"])$(id).value=settings[id];
 renderGoals();renderFilters();
 const result=allPlans();lastResults=result.plans;
 $("planCount").textContent=result.frontierSize+" 种可选";
 $("surprise").disabled=!result.plans.length;
 $("surpriseMessage").textContent=luckyKey?"刚刚选好了！你也可以再抽一次。":"还在犹豫？交给一点小运气。";
 $("stats").replaceChildren(
  node("span","",result.eligible+" 种符合条件的搭配"),
  node("span","",result.frontierSize+" 种各有优点"),
  node("span","",exclusions.size+" 种已排除"));
 const cards=$("cards");cards.replaceChildren();
 if(result.plans.length===0){
  const empty=node("section","empty");
  empty.append(node("h3","","这次还没有找到合适的"),node("p","","换一个条件，就可能有新发现。"));
  const proposals=rescueConstraints(foods,{budget:settings.budget,maxCalories:settings.calories,
   minProtein:settings.protein,goal:settings.goal,excludeIds:[...exclusions]});
  const actions=node("div","rescue-list");
  if(!proposals.length)actions.append(node("p","","试试取消一些不想吃的选项，或者点“重选一次”。"));
  for(const suggestion of proposals.slice(0,3)){
   const b=node("button","rescue-btn","试试："+suggestion.label+" →");b.type="button";
   b.addEventListener("click",()=>{
    settings[suggestion.axis==="calories"?"calories":suggestion.axis]=suggestion.after;
    render();
   });actions.append(b);
  }
  empty.append(actions);cards.append(empty);
 }else{
  for(const p of result.plans.slice(0,expanded?12:3))cards.append(planCard(p));
 }
 const more=$("showMore");
 more.classList.toggle("hide",result.plans.length<=3);
 more.textContent=expanded?"收起其他搭配 ↑":"再看看其他搭配 ↓";
 comparePanel();
 $("announce").textContent="找到 "+result.frontierSize+" 种可选搭配";
}
document.querySelectorAll("[data-goal]").forEach(b=>b.addEventListener("click",()=>{
 settings.goal=b.dataset.goal;selected.clear();expanded=false;luckyKey=null;render();
}));
for(const id of ["budget","calories","protein"])$(id).addEventListener("input",()=>{
 settings[id]=Number($(id).value);selected.clear();expanded=false;luckyKey=null;render();
});
$("showMore").addEventListener("click",()=>{expanded=!expanded;render();});
$("surprise").addEventListener("click",()=>{
 const alternatives=lastResults.slice(0,5).filter(p=>p.foods.join("|")!==luckyKey);
 const pool=alternatives.length?alternatives:lastResults.slice(0,5);
 if(!pool.length)return;
 luckyKey=pool[Math.floor(Math.random()*pool.length)].foods.join("|");
 expanded=true;render();
 const winner=[...document.querySelectorAll(".meal-card")].find(x=>x.dataset.planKey===luckyKey);
 if(winner){winner.setAttribute("tabindex","-1");winner.focus({preventScroll:true});winner.scrollIntoView({behavior:"smooth",block:"center"});}
});
$("reset").addEventListener("click",()=>{
 Object.assign(settings,defaultSettings);exclusions.clear();selected.clear();expanded=false;luckyKey=null;render();
});
render();
