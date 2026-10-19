// Public MCP nutrition data is returned as TOON text inside a JSON envelope.
// Fail closed on missing units/columns; never infer a consumer's current price.
const MAX_ROWS=600;
const MAX_TEXT=300000;
const FIELDS=["content","structuredContent","data","list","items","foods","result",
  "results","text","nutrition","nutritionInfo","foodList"];

function csvCells(line) {
  const result=[];
  let field="", quoted=false;
  for (let i=0;i<line.length;i++) {
    const char=line[i];
    if (char==='"') {
      if (quoted && line[i+1]==='"') {field+='"';i++;}
      else quoted=!quoted;
    } else if (char==="," && !quoted) {
      result.push(field.trim());field="";
    } else field+=char;
  }
  if (quoted) return null;
  result.push(field.trim());
  return result;
}

export function parseToon(raw) {
  if(typeof raw!=="string" || raw.length>MAX_TEXT) return [];
  const matched=raw.trim().match(/^\[(\d+)\]\{([^}\n]+)\}:\s*\n([\s\S]*)$/);
  if (!matched) return [];
  const count=Number(matched[1]);
  if(!Number.isInteger(count)||count>MAX_ROWS) return [];
  const keys=matched[2].split(",").map(x=>x.trim());
  if(!keys.length || keys.some(x=>!x || !/^[A-Za-z][A-Za-z0-9_]*$/.test(x)) ||
     new Set(keys).size!==keys.length) return [];
  const lines=matched[3].split(/\r?\n/).filter(line=>line.trim().length);
  if(lines.length!==count) return []; // incomplete response must not appear complete
  const rows=[];
  for(const line of lines) {
    if(!/^\s/.test(line)) return [];
    const cells=csvCells(line.trim());
    if(!cells || cells.length!==keys.length) return [];
    const row={};
    for(let i=0;i<keys.length;i++){
      const value=cells[i];
      row[keys[i]]=value==="null"||value===""?null:value;
    }
    rows.push(row);
  }
  return rows;
}

function collect(value, output, depth=0) {
  if(depth>9 || output.length>=MAX_ROWS || value==null) return;
  if(typeof value==="string") {
    if(value.length>MAX_TEXT) return;
    if(/^\s*\[\d+\]\{/.test(value)) {
      for(const row of parseToon(value)) if(output.length<MAX_ROWS)output.push(row);
      return;
    }
    try { collect(JSON.parse(value),output,depth+1); } catch { /* untrusted free text */ }
  } else if(Array.isArray(value)) {
    for(const part of value)collect(part,output,depth+1);
  } else if(typeof value==="object") {
    // Failed envelopes must not expose stale nested nutrition as valid data.
    if(value.isError===true || value.success===false) return;
    output.push(value);
    for(const [key,item] of Object.entries(value)) if(FIELDS.includes(key)){
      collect(item,output,depth+1);
    }
  }
}
function numeric(value) {
  if(typeof value==="number")return Number.isFinite(value)?value:null;
  if(typeof value!=="string"||!/^\s*\d+(?:\.\d+)?\s*(?:kcal|g|元)?\s*$/i.test(value))return null;
  return parseFloat(value);
}
function pick(object,keys) {
  for(const key of keys)if(object[key]!==undefined&&object[key]!==null)return object[key];
  return undefined;
}
export function extractNutrition(payload) {
  const nodes=[];
  collect(payload,nodes);
  const seen=new Set(),result=[];
  for(const item of nodes) {
    const info=(item.nutrition&&typeof item.nutrition==="object" ? item.nutrition :
      item.nutritionInfo&&typeof item.nutritionInfo==="object" ? item.nutritionInfo : item);
    const name=pick(item,["name","foodName","food_name","productName","餐品名称","名称"]);
    let calories=numeric(pick(info,["calories","kcal","energyKcal","energy_kcal","热量","能量(kcal)"]));
    const kJ=numeric(pick(info,["energyKj","energy_kj","能量(kJ)"]));
    if(calories===null&&kJ!==null)calories=kJ/4.184;
    const protein=numeric(pick(info,["protein","proteinG","protein_g","蛋白质","蛋白质(g)"]));
    const price=numeric(pick(item,["priceYuan","price_yuan","referencePrice"]));
    if(typeof name!=="string"||!name.trim()||calories===null||protein===null||
       calories<0||protein<0||calories>10000||protein>500) continue;
    const id=String(pick(item,["foodCode","code","id"])??name);
    if(seen.has(id))continue;
    seen.add(id);
    result.push({id,name:name.trim(),calories,protein,price:price===null||price<0?null:price});
  }
  return result;
}
