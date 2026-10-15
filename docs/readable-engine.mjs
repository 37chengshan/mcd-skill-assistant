import {optimize} from "./engine.mjs";
const LABELS={
 zh:{budget:"预算上限",calories:"热量上限",protein:"蛋白质至少",
  title:"这一餐，可以这样选",noOptions:"当前条件下暂时没有合适搭配。",
  priceUnknown:"价格未知",disclaimer:"以下是虚构演示，不代表官方商品、价格或营养建议。"},
 en:{budget:"Budget limit",calories:"Energy limit",protein:"Minimum protein",
  title:"Your meal, your choice",noOptions:"No meal matches these preferences yet.",
  priceUnknown:"Price unknown",
  disclaimer:"These are fictional samples, not an official menu, price quote, or health advice."}
};
export function readableLabels(locale="zh"){
 return LABELS[locale]?{...LABELS[locale]}:null;
}
const numberOrNull=n=>n===null?null:typeof n==="number"&&Number.isFinite(n)&&n>=0?n:undefined;
export function accessibleSuggestions(foods,preferences,locale="zh"){
 const labels=readableLabels(locale);
 if(!labels||!Array.isArray(foods)||!preferences)return {status:"invalid"};
 const budget=numberOrNull(preferences.budget);
 if(budget===undefined||typeof preferences.maxCalories!=="number"||
   !Number.isFinite(preferences.maxCalories)||preferences.maxCalories<0||
   typeof preferences.minProtein!=="number"||!Number.isFinite(preferences.minProtein)||
   preferences.minProtein<0)return {status:"invalid"};
 const outcome=optimize(foods,{budget,maxCalories:preferences.maxCalories,
   minProtein:preferences.minProtein,maxItems:2,limit:5});
 if(!outcome.plans.length)return {status:"no-options",message:labels.noOptions,
   disclaimer:labels.disclaimer};
 const englishNames=new Map(foods.map(f=>[String(f.name),
   typeof f.nameEn==="string"&&f.nameEn.length<70?f.nameEn:String(f.name)]));
 const plans=outcome.plans.map((plan,i)=>{
  const title=(locale==="en"?plan.foods.map(n=>englishNames.get(n)||n):plan.foods).join(" + ");
  const price=plan.price===null?labels.priceUnknown:
    (locale==="en"?"Reference price: "+plan.price.toFixed(1)+" yuan":
      "参考花费 "+plan.price.toFixed(1)+" 元");
  const facts=locale==="en"?
    "Energy "+Math.round(plan.calories)+" kilocalories. Protein "+plan.protein.toFixed(1)+" grams.":
    "热量 "+Math.round(plan.calories)+" 千卡。蛋白质 "+plan.protein.toFixed(1)+" 克。";
  return {rank:i+1,title,price,calories:plan.calories,protein:plan.protein,
   spokenFacts:facts,
   speech:(locale==="en"?"Option "+(i+1)+": ":"第 "+(i+1)+" 份：")+
    title+". "+price+". "+facts+" "+labels.disclaimer};
 });
 return {status:"ok",title:labels.title,plans,disclaimer:labels.disclaimer,
   description:locale==="en"?
     plans.length+" choices meet your selected limits.":
     "有 "+plans.length+" 份搭配符合当前条件。"};
}
