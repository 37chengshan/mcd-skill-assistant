const GOALS=new Set(["balanced","save","protein","light"]);
const RANGES={budget:[15,80],calories:[250,1500],protein:[0,70]};
const STEPS={budget:1,calories:50,protein:5};
const DEFAULTS={goal:"balanced",budget:45,calories:850,protein:25};
function cleanValue(key,value){
 const [min,max]=RANGES[key];
 const n=Number(value);
 if(value===null||value===undefined||value===""||!Number.isFinite(n))return DEFAULTS[key];
 return Math.max(min,Math.min(max,Math.round(n/STEPS[key])*STEPS[key]));
}
export function decodeChoices(params,validFoodIds=[]){
 const p=params instanceof URLSearchParams?params:new URLSearchParams(String(params||""));
 const goal=GOALS.has(p.get("m"))?p.get("m"):DEFAULTS.goal;
 const idSet=new Set(validFoodIds.map(String));
 const exclusions=(p.get("x")||"").slice(0,150).split(",")
  .filter(id=>id&&idSet.has(id)).filter((id,i,a)=>a.indexOf(id)===i);
 return {goal,budget:cleanValue("budget",p.get("b")),
  calories:cleanValue("calories",p.get("c")),protein:cleanValue("protein",p.get("p")),
  excludeIds:exclusions};
}
export function encodeChoices(options={}){
 const query=new URLSearchParams();
 const goal=GOALS.has(options.goal)?options.goal:DEFAULTS.goal;
 query.set("m",goal);
 query.set("b",String(cleanValue("budget",options.budget)));
 query.set("c",String(cleanValue("calories",options.calories)));
 query.set("p",String(cleanValue("protein",options.protein)));
 if(Array.isArray(options.excludeIds)){
  const ids=options.excludeIds.map(String).filter(x=>/^[a-z0-9_-]{1,16}$/i.test(x)).slice(0,32);
  if(ids.length)query.set("x",[...new Set(ids)].sort().join(","));
 }
 return query.toString();
}
