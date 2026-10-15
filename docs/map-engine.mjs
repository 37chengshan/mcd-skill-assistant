import { normalizeFood } from "./engine.mjs";
// Three-dimensional dominance for inspectable choices, never inferred prices.
const finite=(v)=>typeof v==="number"&&Number.isFinite(v)&&v>=0;
export function compareChoices(first,second){
 if(!first||!second)return null;
 const delta=k=>Math.round((second[k]-first[k])*100)/100;
 return {price:delta("price"),calories:delta("calories"),protein:delta("protein")};
}
export function buildChoiceMap(menu,opts={}){
 const budget=opts.budget??70,maxCalories=opts.maxCalories??1000,minProtein=opts.minProtein??0;
 const maxItems=opts.maxItems??1;
 if(!Array.isArray(menu)||menu.length>65||!finite(budget)||budget>1000||
    !finite(maxCalories)||maxCalories>5000||!finite(minProtein)||minProtein>400||
    ![1,2].includes(maxItems))return {status:"invalid"};
 const foods=menu.map(normalizeFood);
 if(foods.some(x=>!x))return {status:"invalid"};
 if(foods.some(x=>x.price===null))return {status:"price-unavailable"};
 if(new Set(foods.map(x=>x.id)).size!==foods.length)return {status:"invalid"};
 const candidates=[];
 const add=(parts)=>{
  const price=Math.round(parts.reduce((s,f)=>s+f.price,0)*100)/100;
  const calories=parts.reduce((s,f)=>s+f.calories,0);
  const protein=parts.reduce((s,f)=>s+f.protein,0);
  if(price>budget||calories>maxCalories||protein<minProtein)return;
  candidates.push({id:parts.map(x=>x.id).join("~"),foodIds:parts.map(x=>x.id),
   label:parts.map(x=>x.name).join(" ＋ "),price,calories,protein});
 };
 for(let i=0;i<foods.length;i++){
  add([foods[i]]);
  if(maxItems===2)for(let j=i+1;j<foods.length;j++)add([foods[i],foods[j]]);
 }
 if(!candidates.length)return {status:"no-options",choices:[],frontierSize:0};
 // Only another candidate that is no more expensive, no more energetic,
 // and no less protein-dense on absolute grams can dominate this choice.
 const choices=candidates.map((item,i)=>{
  const winner=candidates.find((other,j)=>j!==i &&
   other.price<=item.price && other.calories<=item.calories &&
   other.protein>=item.protein &&
   (other.price<item.price||other.calories<item.calories||other.protein>item.protein));
  return {...item,dominated:!!winner,betterAlternative:winner?.label??null};
 });
 choices.sort((a,b)=>Number(a.dominated)-Number(b.dominated)||
   a.price-b.price||a.calories-b.calories||b.protein-a.protein||
   a.id.localeCompare(b.id));
 return {status:"ok",choices,frontierSize:choices.filter(x=>!x.dominated).length,
   candidateCount:choices.length,approximate:false,
   note:"价格和营养数字来自当前演示样例，并非门店实价。"};
}
