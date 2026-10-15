// Compact, account-free nutrition file for local handoff to the browser.
// Never trusts unknown fields; in particular prices, tokens and profiles are forbidden.
const FORMAT="mcdecision.nutrition.v1";
const SOURCE="local-mcd-nutrition-export";
const MAX_TEXT=512*1024;
const MAX_ITEMS=300;
const keys=(object,allowed)=> {
  for(const key of Object.keys(object))
    if(!allowed.includes(key))throw new Error("unexpected field: "+key);
};
function normalizeFood(food){
 if(!food || typeof food!=="object" || Array.isArray(food))throw new Error("invalid food");
 keys(food,["id","name","calories","protein","price"]);
 const id=food.id,name=food.name;
 if(typeof id!=="string"||!/^[a-zA-Z0-9_:.-]{1,90}$/.test(id))throw new Error("invalid id");
 if(typeof name!=="string"||!name.trim()||name.length>80||/[<>\u0000-\u001f]/.test(name))throw new Error("invalid name");
 if(typeof food.calories!=="number"||!Number.isFinite(food.calories)||
    food.calories<0||food.calories>5000)throw new Error("invalid calories");
 if(typeof food.protein!=="number"||!Number.isFinite(food.protein)||
    food.protein<0||food.protein>300)throw new Error("invalid protein");
 if(food.price!==null)throw new Error("price must be unknown");
 return {id,name:name.trim(),calories:food.calories,protein:food.protein,price:null};
}
export function readNutritionSnapshot(input){
 if(typeof input==="string"&&input.length>MAX_TEXT)throw new Error("size limit exceeded");
 let parsed;
 try{parsed=typeof input==="string"?JSON.parse(input):input;}
 catch{throw new Error("invalid file format");}
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("invalid file format");
 keys(parsed,["format","source","capturedAt","priceStatus","foods"]);
 if(parsed.format!==FORMAT)throw new Error("format mismatch");
 if(parsed.source!==SOURCE)throw new Error("source mismatch");
 if(parsed.priceStatus!=="unknown")throw new Error("price must be unknown");
 if(typeof parsed.capturedAt!=="string"||!Number.isFinite(Date.parse(parsed.capturedAt))||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(parsed.capturedAt))throw new Error("invalid timestamp");
 if(!Array.isArray(parsed.foods)||!parsed.foods.length||parsed.foods.length>MAX_ITEMS)throw new Error("catalog invalid");
 const ids=new Set(),foods=[];
 for(const original of parsed.foods){
  const food=normalizeFood(original);
  if(ids.has(food.id))throw new Error("duplicate id");
  ids.add(food.id);foods.push(food);
 }
 return {format:FORMAT,source:SOURCE,capturedAt:parsed.capturedAt,
   priceStatus:"unknown",foods};
}
export function createNutritionSnapshot(foods,when=new Date().toISOString()){
 if(!Array.isArray(foods)||!foods.length||foods.length>MAX_ITEMS)throw new Error("catalog empty or exceeds size limit");
 const safe=foods.map((item,index)=>({
   id:typeof item.id==="string"&&/^[a-zA-Z0-9_:.-]{1,90}$/.test(item.id)?
     item.id:"item-"+index,
   name:item.name,
   calories:item.calories,
   protein:item.protein,
   price:null
 }));
 return readNutritionSnapshot({format:FORMAT,source:SOURCE,capturedAt:when,
    priceStatus:"unknown",foods:safe});
}
