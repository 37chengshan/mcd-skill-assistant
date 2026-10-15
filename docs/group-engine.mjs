import { normalizeFood } from "./engine.mjs";
// V3: deterministic, side-effect-free group allocations for *illustrative* priced menus.
// All prices must be supplied; unknown prices are never treated as free.
const GOALS=new Set(["balanced","save","protein","light"]);
const safeNumber=(n)=>typeof n==="number"&&Number.isFinite(n)&&n>=0;
const round=(n)=>Math.round(n*100)/100;
function optionsForGuest(foods,person){
 const excluded=new Set(person.excludeIds);
 const available=foods.filter(f=>!excluded.has(f.id));
 const choices=[];
 function add(items){
  const price=round(items.reduce((s,f)=>s+f.price,0));
  const calories=items.reduce((s,f)=>s+f.calories,0);
  const protein=items.reduce((s,f)=>s+f.protein,0);
  if(price>person.budget||calories>person.maxCalories||protein<person.minProtein)return;
  const costMargin=(person.budget-price)/Math.max(person.budget,1);
  const lightMargin=(person.maxCalories-calories)/Math.max(person.maxCalories,1);
  const proteinScore=Math.min(2,protein/Math.max(person.minProtein,12));
  const extra=person.goal==="save"?costMargin*26:
    person.goal==="light"?lightMargin*24:
    person.goal==="protein"?proteinScore*18: (costMargin+lightMargin)*8;
  const score=round(50+costMargin*9+lightMargin*9+proteinScore*12+extra);
  choices.push({foodIds:items.map(f=>f.id),foods:items.map(f=>f.name),
    price,calories,protein,score});
 }
 for(let i=0;i<available.length;i++){
  add([available[i]]);
  for(let j=i+1;j<available.length;j++)add([available[i],available[j]]);
 }
 choices.sort((a,b)=>b.score-a.score||a.price-b.price||a.foodIds.join("|").localeCompare(b.foodIds.join("|")));
 const cheapest=[...choices].sort((a,b)=>a.price-b.price||b.score-a.score).slice(0,6);
 return [...new Map([...choices.slice(0,14),...cheapest].map(x=>[x.foodIds.join("|"),x])).values()];
}
export function planGroup(menu,guests,options={}){
 if(!Array.isArray(menu)||!Array.isArray(guests)||guests.length<2||guests.length>6||
   !safeNumber(options.groupBudget)||options.groupBudget>2000)return {status:"invalid"};
 if(menu.length>70)return {status:"invalid"};
 const catalog=menu.map(normalizeFood);
 if(catalog.some(f=>!f)||catalog.some(f=>f.price===null))return {status:"price-unavailable"};
 const knownIds=new Set(),people=[];
 for(let i=0;i<guests.length;i++){
  const p=guests[i];
  if(!p||typeof p!=="object"||!safeNumber(p.budget)||p.budget>500||
     !safeNumber(p.maxCalories)||p.maxCalories>3000||
     !safeNumber(p.minProtein)||p.minProtein>200||
     typeof p.name!=="string"||!p.name.trim()||
     p.name.length>24||/[<>\r\n]/.test(p.name)||
     !GOALS.has(p.goal)||!Array.isArray(p.excludeIds))return {status:"invalid"};
  const id=String(p.id??i);
  if(knownIds.has(id))return {status:"invalid"};
  knownIds.add(id);
  people.push({id,name:p.name.trim(),budget:p.budget,maxCalories:p.maxCalories,
    minProtein:p.minProtein,goal:p.goal,excludeIds:p.excludeIds.map(String)});
 }
 const usedCatalog=catalog.length<=28?catalog:[...catalog]
   .sort((a,b)=>(b.protein/(b.calories+100))-(a.protein/(a.calories+100))||a.price-b.price)
   .slice(0,22);
 const lists=people.map(p=>optionsForGuest(usedCatalog,p));
 const blockedMembers=people.filter((p,i)=>lists[i].length===0).map(p=>p.name);
 if(blockedMembers.length)return {status:"no-options",blockedMembers};
 const minCosts=lists.map(list=>Math.min(...list.map(x=>x.price)));
 const minimumTotal=round(minCosts.reduce((a,b)=>a+b,0));
 if(minimumTotal>options.groupBudget)return {status:"budget-too-low",minimumTotal};
 const minAfter=lists.map((_,i)=>round(minCosts.slice(i+1).reduce((a,b)=>a+b,0)));
 let beam=[{total:0,minScore:Infinity,sumScore:0,selections:[],distinct:new Set()}];
 for(let i=0;i<lists.length;i++){
  const next=[];
  for(const state of beam){
   for(const option of lists[i]){
    const total=round(state.total+option.price);
    if(total+minAfter[i]>options.groupBudget+1e-8)continue;
    const distinct=new Set([...state.distinct,...option.foodIds]);
    next.push({total,minScore:Math.min(state.minScore,option.score),
      sumScore:state.sumScore+option.score,distinct,
      selections:[...state.selections,{
        memberId:people[i].id,name:people[i].name,goal:people[i].goal,...option
      }]});
   }
  }
  next.sort((a,b)=>b.minScore-a.minScore||b.sumScore-a.sumScore||
    b.distinct.size-a.distinct.size||a.total-b.total||
    a.selections.map(s=>s.foodIds.join(",")).join(";").localeCompare(
      b.selections.map(s=>s.foodIds.join(",")).join(";")));
  // Limit search with stable beam selection; do not claim global optimality.
  beam=next.slice(0,350);
  if(!beam.length)return {status:"budget-too-low",minimumTotal};
 }
 const winner=beam[0];
 return {status:"ok",selections:winner.selections,total:winner.total,
   remaining:round(options.groupBudget-winner.total),
   groupBudget:options.groupBudget,minimumTotal,
   uniqueFoods:winner.distinct.size,approximate:true,memberCount:people.length,
   disclaimer:"示例数据仅供体验；方案为有限搜索的参考搭配，非真实门店报价。"};
}
export function groupPresets(){
 return [
  {label:"午间同伴",groupBudget:82,guests:[
    {id:"one",name:"我",budget:40,maxCalories:700,minProtein:22,goal:"protein",excludeIds:[]},
    {id:"two",name:"朋友",budget:42,maxCalories:850,minProtein:17,goal:"save",excludeIds:[]}]},
  {label:"三人小聚",groupBudget:125,guests:[
    {id:"one",name:"一号朋友",budget:45,maxCalories:800,minProtein:20,goal:"balanced",excludeIds:[]},
    {id:"two",name:"二号朋友",budget:45,maxCalories:650,minProtein:15,goal:"light",excludeIds:[]},
    {id:"three",name:"三号朋友",budget:45,maxCalories:900,minProtein:26,goal:"protein",excludeIds:[]}]},
  {label:"周末四人局",groupBudget:150,guests:Array.from({length:4},(_,i)=>({
    id:"guest"+i,name:"朋友 "+(i+1),budget:45,maxCalories:850,
    minProtein:14,goal:["balanced","save","light","protein"][i],excludeIds:[]}))}
 ];
}
