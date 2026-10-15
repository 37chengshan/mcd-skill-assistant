import { normalizeFood } from "./engine.mjs";
// Seven independent lunches, not complete daily dietary or medical guidance.
const LABELS=["周一","周二","周三","周四","周五","周六","周日"];
const GOALS=new Set(["balanced","save","protein","light"]);
const good=(x)=>typeof x==="number"&&Number.isFinite(x)&&x>=0;
const r=(x)=>Math.round(x*100)/100;
function normalizeOptions(options={}){
 const o={budget:options.budget,maxCalories:options.maxCalories??900,
   minProtein:options.minProtein??12,goal:options.goal??"balanced",variety:options.variety??70};
 if(!good(o.budget)||o.budget>500||!good(o.maxCalories)||o.maxCalories>3000||
    !good(o.minProtein)||o.minProtein>200||!good(o.variety)||o.variety>100||
    !GOALS.has(o.goal))return null;
 return o;
}
function choices(foods,options){
 const available=foods.filter(x=>x.price<=options.budget);
 const out=[];
 for(let i=0;i<available.length;i++){
  for(let j=i;j<available.length;j++){
   if(i===j)continue; // disallow ordering the same food twice as one lunch
   const pair=j===i+0?[available[i]]:[available[i],available[j]];
   if(pair.length===0)continue;
   const price=r(pair.reduce((sum,f)=>sum+f.price,0));
   const calories=pair.reduce((sum,f)=>sum+f.calories,0);
   const protein=pair.reduce((sum,f)=>sum+f.protein,0);
   if(price>options.budget||calories>options.maxCalories||protein<options.minProtein)continue;
   const cost=(options.budget-price)/Math.max(options.budget,1);
   const light=(options.maxCalories-calories)/Math.max(options.maxCalories,1);
   const nutrition=Math.min(2,protein/Math.max(options.minProtein,12));
   const score=(options.goal==="save"?cost*55+nutrition*19+light*11:
     options.goal==="protein"?nutrition*55+cost*17+light*8:
     options.goal==="light"?light*55+nutrition*20+cost*10:
     cost*24+nutrition*31+light*23);
   out.push({foodIds:pair.map(f=>f.id),foods:pair.map(f=>f.name),
     price,calories,protein,score:r(score)});
  }
  if(available[i].calories<=options.maxCalories && available[i].protein>=options.minProtein){
   const f=available[i];
   const cost=(options.budget-f.price)/Math.max(options.budget,1);
   const light=(options.maxCalories-f.calories)/Math.max(options.maxCalories,1);
   const nutrition=Math.min(2,f.protein/Math.max(options.minProtein,12));
   const score=(options.goal==="save"?cost*55+nutrition*19+light*11:
     options.goal==="protein"?nutrition*55+cost*17+light*8:
     options.goal==="light"?light*55+nutrition*20+cost*10:
     cost*24+nutrition*31+light*23);
   out.push({foodIds:[f.id],foods:[f.name],price:f.price,
     calories:f.calories,protein:f.protein,score:r(score)});
  }
 }
 return out.sort((a,b)=>b.score-a.score||a.price-b.price||
   a.foodIds.join("|").localeCompare(b.foodIds.join("|")));
}
const signature=p=>p.foodIds.join("|");
function grade(candidate,history,variety){
 const repeated=history.filter(x=>signature(x)===signature(candidate)).length;
 const overlap=history.reduce((sum,x)=>sum+
   candidate.foodIds.filter(id=>x.foodIds.includes(id)).length,0);
 return candidate.score-variety*repeated*0.8-variety*overlap*0.13;
}
function wrap(days){
 const total=r(days.reduce((sum,day)=>sum+day.price,0));
 return {status:"ok",days,total,uniqueMeals:new Set(days.map(signature)).size,
   approximate:true,
   note:"这份灵感安排仅使用示例数据，属于七次单独餐食，不是完整的每日饮食建议。"};
}
export function buildWeek(menu,options={}){
 const o=normalizeOptions(options);
 if(!o||!Array.isArray(menu)||menu.length>70)return {status:"invalid"};
 const foods=menu.map(normalizeFood);
 if(foods.some(x=>!x))return {status:"invalid"};
 if(foods.some(x=>x.price===null))return {status:"price-unavailable"};
 const catalog=foods.length<=24?foods:foods.slice(0,24);
 const list=choices(catalog,o);
 if(!list.length)return {status:"no-options"};
 const days=[];
 for(let day=0;day<7;day++){
  const best=[...list].sort((a,b)=>grade(b,days,o.variety)-grade(a,days,o.variety)||
    b.score-a.score||a.price-b.price||signature(a).localeCompare(signature(b)))[0];
  days.push({...best,day:LABELS[day]});
 }
 return wrap(days);
}
export function replaceDay(menu,plan,index,options={}){
 if(!plan||plan.status!=="ok"||!Array.isArray(plan.days)||plan.days.length!==7||
    !Number.isInteger(index)||index<0||index>=7)return {status:"invalid"};
 const o=normalizeOptions(options);
 if(!o||!Array.isArray(menu))return {status:"invalid"};
 const foods=menu.map(normalizeFood);
 if(foods.some(x=>!x))return {status:"invalid"};
 if(foods.some(x=>x.price===null))return {status:"price-unavailable"};
 const catalog=foods.length<=24?foods:foods.slice(0,24);
 const candidates=choices(catalog,o).filter(x=>signature(x)!==signature(plan.days[index]));
 if(!candidates.length)return {status:"no-alternative"};
 const history=plan.days.filter((_,i)=>i!==index);
 const alt=[...candidates].sort((a,b)=>grade(b,history,o.variety)-grade(a,history,o.variety)||
   b.score-a.score||a.price-b.price||signature(a).localeCompare(signature(b)))[0];
 return wrap(plan.days.map((day,i)=>i===index?{...alt,day:LABELS[index]}:{...day}));
}
export function weekPresets(){
 return [{name:"轻松一周",options:{budget:39,maxCalories:750,minProtein:18,variety:85,goal:"balanced"}},
  {name:"预算友好",options:{budget:30,maxCalories:800,minProtein:15,variety:80,goal:"save"}},
  {name:"蛋白质优先",options:{budget:48,maxCalories:800,minProtein:25,variety:95,goal:"protein"}}];
}
