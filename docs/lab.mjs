import { optimize } from "./engine.mjs";
// Confidence-aware comparison: no invented price or official endorsement.
export function comparePlans(a,b) {
  if(!a||!b)return null;
  const diff=(key)=>Number((b[key]-a[key]).toFixed(2));
  const price=a.price==null||b.price==null?null:diff("price");
  const calories=diff("calories"),protein=diff("protein");
  return {price,calories,protein,narrative:[
    price===null?"价格差未知":"价格"+(price>=0?"增加":"减少")+" ¥"+Math.abs(price).toFixed(1),
    "能量"+(calories>=0?"增加":"减少")+" "+Math.abs(Math.round(calories))+" kcal",
    "蛋白质"+(protein>=0?"增加":"减少")+" "+Math.abs(protein).toFixed(1)+" g"
  ].join(" · ")};
}
export function explainPlan(plan,options={}) {
  if(!plan)return [];
  const facts=[];
  const budget=Number(options.budget),max=Number(options.maxCalories),min=Number(options.minProtein);
  if(plan.price!==null&&Number.isFinite(budget))facts.push({
    label:"预算余量",value:"¥"+Math.max(0,budget-plan.price).toFixed(1),
    detail:"参考价格仅为虚构样例，实际价格未知"
  });
  if(Number.isFinite(max))facts.push({
    label:"热量余量",value:Math.max(0,Math.round(max-plan.calories))+" kcal",
    detail:"符合自设约束，不构成医疗建议"
  });
  if(Number.isFinite(min))facts.push({
    label:"蛋白质超出目标",value:Math.max(0,plan.protein-min).toFixed(1)+" g",
    detail:"该样例指标仅用于演示"
  });
  return facts;
}
// Counterfactual: vary exactly one constraint while holding all other choices constant.
export function rescueConstraints(foods,options={}) {
  const budget=Number(options.budget),calories=Number(options.maxCalories),protein=Number(options.minProtein);
  const results=[];
  if(Number.isFinite(budget)){
    for(let v=Math.ceil(budget+1);v<=120;v++){
      const r=optimize(foods,{...options,budget:v,limit:1});
      if(r.plans.length){results.push({axis:"budget",before:budget,after:v,
        label:"预算提高 ¥"+(v-budget),plan:r.plans[0]});break;}
    }
  }
  if(Number.isFinite(calories)){
    for(let v=Math.ceil(calories/50)*50+50;v<=2000;v+=50){
      const r=optimize(foods,{...options,maxCalories:v,limit:1});
      if(r.plans.length){results.push({axis:"calories",before:calories,after:v,
        label:"热量上限增加 "+(v-calories)+" kcal",plan:r.plans[0]});break;}
    }
  }
  if(Number.isFinite(protein)){
    for(let v=Math.max(0,protein-5);v>=0;v=Math.max(0,v-5)){
      const r=optimize(foods,{...options,minProtein:v,limit:1});
      if(r.plans.length){results.push({axis:"protein",before:protein,after:v,
        label:"最低蛋白质目标降低 "+(protein-v)+" g",plan:r.plans[0]});break;}
      if(v===0)break;
    }
  }
  const scale={budget:30,calories:500,protein:30};
  return results.sort((a,b)=>Math.abs(a.after-a.before)/scale[a.axis]-
    Math.abs(b.after-b.before)/scale[b.axis]);
}
export function scenarioSummary(foods,options={}) {
  const baseline=optimize(foods,{...options,limit:10});
  const nextGoal=options.hasPrices===false ? (options.goal==="light"?"protein":"light") : (options.goal==="save"?"protein":"save");
  const alternate=optimize(foods,{...options,goal:nextGoal,limit:10});
  return {baseline,alternate,shifts:baseline.plans[0]&&alternate.plans[0]?
    comparePlans(baseline.plans[0],alternate.plans[0]):null};
}
