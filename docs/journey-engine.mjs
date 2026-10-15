import {optimize} from "./engine.mjs";
import {planGroup} from "./group-engine.mjs";
import {buildWeek} from "./week-engine.mjs";
import {encodeChoices} from "./share.mjs";
// Scene coordinator: no credentials, ordering or network side effects.
const scenes=new Set(["solo","group","week"]);
const goals=new Set(["balanced","save","protein","light"]);
function valid(p){
 return p&&typeof p==="object"&&scenes.has(p.scene)&&goals.has(p.goal)&&
 Number.isInteger(p.budget)&&p.budget>=15&&p.budget<=80&&
 Number.isInteger(p.maxCalories)&&p.maxCalories>=200&&p.maxCalories<=1500&&
 Number.isInteger(p.minProtein)&&p.minProtein>=0&&p.minProtein<=70&&
 Number.isInteger(p.variety)&&p.variety>=0&&p.variety<=100&&
 Number.isInteger(p.guests)&&p.guests>=2&&p.guests<=6;
}
export function previewJourney(menu,prefs){
 if(!valid(prefs)||!Array.isArray(menu))return {status:"invalid"};
 if(prefs.scene==="solo"){
  const r=optimize(menu,{budget:prefs.budget,maxCalories:prefs.maxCalories,
    minProtein:prefs.minProtein,goal:prefs.goal,maxItems:2,limit:5});
  if(!r.plans.length)return {status:"no-options"};
  return {status:"ok",scene:"solo",cards:r.plans.map(p=>({
    title:p.foods.join(" ＋ "),price:p.price,calories:p.calories,protein:p.protein
  })),summary:"为你找到 "+r.frontierSize+" 种各有优势的搭配"};
 }
 if(prefs.scene==="group"){
  const people=Array.from({length:prefs.guests},(_,i)=>({
   id:"friend"+i,name:i===0?"我":"朋友 "+i,
   budget:prefs.budget,maxCalories:prefs.maxCalories,minProtein:prefs.minProtein,
   goal:prefs.goal,excludeIds:[]
  }));
  const r=planGroup(menu,people,{groupBudget:prefs.budget*prefs.guests});
  if(r.status!=="ok")return {status:r.status,minimumTotal:r.minimumTotal};
  return {status:"ok",scene:"group",cards:r.selections.map(x=>({
    title:x.name+" · "+x.foods.join(" ＋ "),price:x.price,calories:x.calories,protein:x.protein
  })),summary:"为 "+r.memberCount+" 人找到参考搭配，整桌合计 ¥"+r.total.toFixed(0)};
 }
 const r=buildWeek(menu,{budget:prefs.budget,maxCalories:prefs.maxCalories,
   minProtein:prefs.minProtein,variety:prefs.variety,goal:prefs.goal});
 if(r.status!=="ok")return {status:r.status};
 return {status:"ok",scene:"week",cards:r.days.map(x=>({
   title:x.day+" · "+x.foods.join(" ＋ "),price:x.price,calories:x.calories,protein:x.protein
 })),summary:"七次午餐，共 "+r.uniqueMeals+" 种不同搭配，参考合计 ¥"+r.total.toFixed(0)};
}
export function deepLinkJourney(prefs){
 if(!valid(prefs))return null;
 if(prefs.scene==="solo")return "./index.html?"+encodeChoices({
  goal:prefs.goal,budget:prefs.budget,calories:prefs.maxCalories,
  protein:prefs.minProtein,excludeIds:[]
 });
 const params=[["m",prefs.goal],["b",prefs.budget],["c",prefs.maxCalories],
   ["p",prefs.minProtein]];
 if(prefs.scene==="group")params.push(["g",prefs.guests]);
 else params.push(["v",prefs.variety]);
 return (prefs.scene==="group"?"./group.html?":"./week.html?")+
   params.map(([key,value])=>encodeURIComponent(key)+"="+encodeURIComponent(value)).join("&");
}
