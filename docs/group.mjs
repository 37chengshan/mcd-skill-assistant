import { groupPresets,planGroup } from "./group-engine.mjs";
// V3 uses explicitly fictional menu figures only. Nothing is sent to a server.
const menu=[
{id:"a",name:"香煎鸡肉堡",calories:360,protein:24,price:22},
{id:"b",name:"玉米小杯",calories:90,protein:3,price:10},
{id:"c",name:"牛肉堡",calories:410,protein:22,price:23},
{id:"d",name:"田园沙拉",calories:60,protein:2,price:12},
{id:"e",name:"无糖饮品",calories:0,protein:0,price:9},
{id:"f",name:"烤鸡卷",calories:320,protein:20,price:20},
{id:"g",name:"酸奶",calories:130,protein:8,price:12},
{id:"h",name:"鸡蛋三明治",calories:280,protein:16,price:18}
];
const presets=groupPresets();
const $=id=>document.getElementById(id);
let budget=presets[0].groupBudget;
let people=structuredClone(presets[0].guests);
let guided=false;
const guidedParams=new URLSearchParams(window.location.search);
if(guidedParams.has("g")){
 const num=Number(guidedParams.get("g")),per=Number(guidedParams.get("b"));
 const cal=Number(guidedParams.get("c")),pro=Number(guidedParams.get("p")),m=guidedParams.get("m");
 if(Number.isInteger(num)&&num>=2&&num<=6&&Number.isInteger(per)&&per>=15&&per<=80&&
   Number.isInteger(cal)&&cal>=200&&cal<=1500&&Number.isInteger(pro)&&pro>=0&&pro<=70&&
   ["balanced","save","protein","light"].includes(m)){
  people=Array.from({length:num},(_,i)=>({id:"guided"+i,name:i?"朋友 "+i:"我",
   budget:per,maxCalories:cal,minProtein:pro,goal:m,excludeIds:[]}));
  budget=per*num;guided=true;
 }
}
let last=null;
const make=(tag,cls,text)=>{
 const el=document.createElement(tag);if(cls)el.className=cls;
 if(text!==undefined)el.textContent=text;return el;
};
function field(name,type,value,attrs={}){
 const wrap=make("label","",name),input=document.createElement(type==="select"?"select":"input");
 if(type==="select")for(const [value,label] of Object.entries(attrs.options)){
   const option=make("option","",label);option.value=value;input.append(option);
 }else{
   input.type=type;
   if(attrs.min!==undefined)input.min=attrs.min;
   if(attrs.max!==undefined)input.max=attrs.max;
 }
 input.value=value;
 wrap.append(input);
 return {wrap,input};
}
function renderForm(){
 $("peopleCount").textContent=people.length+" 位";
 $("groupBudget").value=budget;
 $("groupBudgetValue").textContent="¥"+budget;
 $("addPerson").disabled=people.length>=6;
 $("removePerson").disabled=people.length<=2;
 const area=$("people");area.replaceChildren();
 people.forEach((person,index)=>{
  const card=make("article","person");
  const head=make("div","person-title");
  head.append(make("span","avatar",["🌼","🌿","🌟","🎈","🍀","🧡"][index]),make("h3","", "第 "+(index+1)+" 位"));
  card.append(head);
  const fields=make("div","fields");
  const specs=[
   ["name","怎么称呼","text",person.name,{max:14}],
   ["budget","个人预算","number",person.budget,{min:0,max:500}],
   ["maxCalories","热量上限","number",person.maxCalories,{min:0,max:3000}],
   ["minProtein","至少蛋白质","number",person.minProtein,{min:0,max:200}],
   ["goal","更在意","select",person.goal,{options:{balanced:"均衡一点",save:"更省一点",protein:"多些蛋白质",light:"轻盈一点"}}]
  ];
  for(const [key,label,type,value,attrs] of specs){
   const {wrap,input}=field(label,type,value,attrs);
   if(type==="text")input.maxLength=14;
   input.dataset.field=key;input.dataset.member=index;
   fields.append(wrap);
  }
  card.append(fields);
  const ignore=make("div","avoid-row");
  const {wrap,input}=field("有没有一种不想吃的？","select",person.excludeIds?.[0]||"",{
   options:Object.fromEntries([["","没有"],...menu.map(food=>[food.id,food.name])])
  });
  input.dataset.member=index;input.dataset.field="avoid";
  ignore.append(wrap);card.append(ignore);area.append(card);
 });
}
function renderPresetButtons(active){
 const box=$("presets");box.replaceChildren();
 presets.forEach((preset,i)=>{
  const b=make("button","preset",preset.label);b.type="button";
  b.setAttribute("aria-pressed",String(active===i));
  b.addEventListener("click",()=>{
   people=structuredClone(preset.guests);budget=preset.groupBudget;last=null;renderForm();renderPresetButtons(i);
   renderResult();
  });
  box.append(b);
 });
}
function renderResult(){
 const area=$("result");area.replaceChildren();
 if(!last){
  const empty=make("div","empty");empty.append(make("strong","","每个人都可以有自己的选择"),make("p","","调整好大家的偏好，再点一下安排。"));area.append(empty);return;
 }
 if(last.status!=="ok"){
  const empty=make("div","empty");
  const title={invalid:"请检查人数和填写的数字", "no-options":"有人的条件暂时无法满足",
    "budget-too-low":"这桌预算还不太够","price-unavailable":"有些菜没有参考价格"}[last.status]||"还没有合适的搭配";
  empty.append(make("strong","",title));
  let msg="请调整条件，再试试看。";
  if(last.status==="no-options")msg="可以先放宽 "+last.blockedMembers.join("、")+" 的条件。";
  if(last.status==="budget-too-low")msg="即使每个人都选择最低价的合适搭配，这一桌也至少要 ¥"+last.minimumTotal.toFixed(0)+"。";
  empty.append(make("p","",msg));area.append(empty);return;
 }
 const summary=make("div","summary");
 for(const [label,value] of [["总参考价","¥"+last.total.toFixed(0)],["剩余预算","¥"+last.remaining.toFixed(0)],["参与人数",last.memberCount+" 人"]]){
  const tile=make("div");tile.append(make("strong","",value),make("span","",label));summary.append(tile);
 }
 area.append(summary);
 for(const pick of last.selections){
  const row=make("article","selection"),top=make("div","selection-head");
  top.append(make("strong","",pick.name),make("span","mini-title","¥"+pick.price.toFixed(0)));
  row.append(top,make("div","selection-name",pick.foods.join(" ＋ ")),
    make("div","stat-line",Math.round(pick.calories)+" 千卡 · 蛋白质 "+pick.protein.toFixed(1)+" 克"));
  area.append(row);
 }
 area.append(make("p","hint","每个人都符合自己填写的预算和营养条件；为了照顾整桌预算，推荐不一定是每个人单独最喜欢的一份。价格均为演示示例。"));
 const copy=make("button","copy","↗ 复制大家的搭配");copy.type="button";
 copy.addEventListener("click",async()=>{
  const lines=["【演示数据 · 不是真实菜单及报价】","合计参考 ¥"+last.total.toFixed(0),
  ...last.selections.map(x=>x.name+"："+x.foods.join(" + ")+" / ¥"+x.price.toFixed(0))];
  try{await navigator.clipboard.writeText(lines.join("\n"));copy.textContent="✓ 已复制";}
  catch{copy.textContent="复制不可用，请手动选择文字";}
 });
 area.append(copy);
}
$("groupBudget").addEventListener("input",()=>{
 budget=Number($("groupBudget").value);$("groupBudgetValue").textContent="¥"+budget;
});
$("people").addEventListener("change",event=>{
 const target=event.target,idx=Number(target.dataset.member),key=target.dataset.field;
 if(!Number.isInteger(idx)||!people[idx]||!key)return;
 if(key==="avoid")people[idx].excludeIds=target.value?[target.value]:[];
 else if(key==="name")people[idx].name=target.value.trim().slice(0,14)||"朋友";
 else if(key==="goal")people[idx].goal=target.value;
 else people[idx][key]=Number(target.value);
});
$("addPerson").addEventListener("click",()=>{
 if(people.length>=6)return;
 people.push({id:"extra"+Date.now()+people.length,name:"朋友 "+(people.length+1),
  budget:40,maxCalories:800,minProtein:15,goal:"balanced",excludeIds:[]});
 last=null;renderForm();renderPresetButtons(-1);renderResult();
});
$("removePerson").addEventListener("click",()=>{
 if(people.length<=2)return;people.pop();last=null;renderForm();renderPresetButtons(-1);renderResult();
});
$("generate").addEventListener("click",()=>{
 // Collect the latest form values, including edits that haven't blurred yet.
 for(const input of document.querySelectorAll("#people [data-field]")){
  const idx=Number(input.dataset.member),key=input.dataset.field;
  if(!people[idx])continue;
  if(key==="avoid")people[idx].excludeIds=input.value?[input.value]:[];
  else if(key==="name")people[idx].name=input.value.trim().slice(0,14)||"朋友";
  else if(key==="goal")people[idx].goal=input.value;
  else people[idx][key]=Number(input.value);
 }
 last=planGroup(menu,people,{groupBudget:budget});
 renderResult();
 if(innerWidth<=800)document.getElementById("results-title").scrollIntoView({behavior:"smooth",block:"start"});
});
renderForm();renderPresetButtons(guided?-1:0);renderResult();
