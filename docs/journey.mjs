import { previewJourney,deepLinkJourney } from "./journey-engine.mjs";
// Entirely fictional examples. The wizard never asks for identity or authorization.
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
const $=id=>document.getElementById(id);
const defaults={scene:"solo",goal:"balanced",budget:45,maxCalories:850,minProtein:20,variety:70,guests:2};
let settings={...defaults},step=0;
const create=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
function heading(label,title,description){
 const box=create("div","view-head");
 box.append(create("div","small-title",label),create("h2","",title),create("p","",description));return box;
}
function renderScenes(slot){
 slot.append(heading("先从生活开始","这一餐，是什么场合？","轻轻选一个最接近的情境，下一步再调整。"));
 const scenes=[
  ["solo","🍔","自己吃","给今天的自己选一份，先从预算和营养开始"],
  ["group","🧑‍🤝‍🧑","和朋友吃","每个人都有不同口味，试试一起安排"],
  ["week","🗓️","想安排一周","七次午餐都带点变化，每天都可以调整"]
 ];
 const grid=create("div","scenes");
 for(const [id,emoji,title,desc] of scenes){
  const b=create("button","scene");b.type="button";
  b.setAttribute("aria-pressed",String(settings.scene===id));
  b.append(create("span","emoji",emoji),create("strong","",title),create("span","",desc));
  b.addEventListener("click",()=>{settings.scene=id;render();});
  grid.append(b);
 }slot.append(grid);
}
function slider(slot,key,title,min,max,stepValue,suffix){
 const box=create("div","field"),label=create("label");
 const id="slider-"+key;label.htmlFor=id;
 label.append(create("span","",title),create("output","",settings[key]+suffix));
 const input=document.createElement("input");input.type="range";input.id=id;
 input.min=min;input.max=max;input.step=stepValue;input.value=settings[key];
 input.addEventListener("input",()=>{settings[key]=Number(input.value);label.querySelector("output").textContent=input.value+suffix;});
 box.append(label,input);slot.append(box);
}
function renderPrefs(slot){
 const label=settings.scene==="solo"?"给自己一点灵感":settings.scene==="group"?"让大家都满意":"一周都吃得新鲜";
 slot.append(heading("你的想法最重要",label,"调整你的侧重点，不需要一次就选对。"));
 const moods=create("div","moods");
 const values=[["balanced","⚖️ 均衡一点"],["save","💰 少花一点"],["protein","💪 多点蛋白质"],["light","🍃 轻盈一点"]];
 for(const [id,text] of values){
  const b=create("button","mood",text);b.type="button";b.setAttribute("aria-pressed",String(settings.goal===id));
  b.addEventListener("click",()=>{settings.goal=id;render();});moods.append(b);
 }slot.append(moods);
 const fields=create("div","fields");
 slider(fields,"budget",settings.scene==="group"?"每个人的参考预算":"每餐参考预算",15,90,1," 元");
 slider(fields,"maxCalories","热量不超过",200,1500,50," 千卡");
 slider(fields,"minProtein","蛋白质至少",0,75,5," 克");
 if(settings.scene==="week")slider(fields,"variety","希望更多不同口味",0,100,10,"%");
 if(settings.scene==="group")slider(fields,"guests","一共几个人",2,6,1," 人");
 slot.append(fields);
 slot.append(create("p","hint","这些只是你自己设置的参考条件，不代表任何医疗建议。"));
}
function renderPreview(slot){
 slot.append(heading("已经到最后一步","来看看你会怎么选","这些是虚构数据算出的结果；不满意可以回去改条件。"));
 const answer=previewJourney(menu,settings);
 if(answer.status!=="ok"){
  const no=create("div","empty");
  no.append(create("strong","","暂时没有合适的选择"),
   create("p","","试试提高参考预算、放宽热量上限，或稍微降低蛋白质目标。"));
  slot.append(no);return;
 }
 slot.append(create("div","summary",answer.summary));
 const cards=create("div","results");
 for(const p of answer.cards.slice(0,7)){
  const card=create("article","result");
  card.append(create("strong","",p.title),
    create("span","",(p.price==null?"价格未知":"参考 ¥"+p.price.toFixed(0))+
     " · "+Math.round(p.calories)+" 千卡 · 蛋白质 "+p.protein.toFixed(1)+" 克"));
  cards.append(card);
 }
 slot.append(cards);
 const link=create("a","button primary","到完整页面继续调整 →");
 link.href=deepLinkJourney(settings);link.style.textDecoration="none";
 link.style.display="inline-flex";link.style.alignItems="center";
 slot.append(link,create("p","hint","进入完整页面后，可以继续微调人数、换掉不喜欢的选项或比较更多搭配。"));
}
function render(){
 const view=$("view");view.replaceChildren();
 document.querySelectorAll("[data-stage]").forEach(item=>{
  const value=Number(item.dataset.stage);
  item.setAttribute("aria-current",value===step?"step":"false");
  item.dataset.done=String(value<step);
 });
 if(step===0)renderScenes(view);
 else if(step===1)renderPrefs(view);
 else renderPreview(view);
 $("back").disabled=step===0;
 $("next").textContent=step===2?"重新选一个场景 ↺":"继续 →";
}
$("next").addEventListener("click",()=>{
 step=step===2?0:step+1;render();
 document.querySelector(".view-head h2")?.setAttribute("tabindex","-1");
 document.querySelector(".view-head h2")?.focus({preventScroll:true});
});
$("back").addEventListener("click",()=>{step=Math.max(0,step-1);render();});
$("save").addEventListener("click",()=>{
 try{localStorage.setItem("mcdecision-journey-demo",JSON.stringify({version:1,settings,step}));
 $("status").textContent="已保存在这个浏览器里，下次可以从这里继续。";}
 catch{$("status").textContent="这里暂时无法保存，不过仍可以继续体验。";}
});
$("clear").addEventListener("click",()=>{
 try{localStorage.removeItem("mcdecision-journey-demo");$("status").textContent="已清空这台设备上保存的引导偏好。";}
 catch{$("status").textContent="当前浏览器无法删除保存内容。";}
});
try{
 const raw=localStorage.getItem("mcdecision-journey-demo");
 if(raw&&raw.length<=2000){
  const saved=JSON.parse(raw);
  const p=saved.settings;
  if(saved.version===1&&p&&["solo","group","week"].includes(p.scene)&&
   ["balanced","save","protein","light"].includes(p.goal)&&
   Number.isInteger(p.budget)&&p.budget>=15&&p.budget<=90&&
   Number.isInteger(p.maxCalories)&&p.maxCalories>=200&&p.maxCalories<=1500&&
   Number.isInteger(p.minProtein)&&p.minProtein>=0&&p.minProtein<=75&&
   Number.isInteger(p.variety)&&p.variety>=0&&p.variety<=100&&
   Number.isInteger(p.guests)&&p.guests>=2&&p.guests<=6&&
   Number.isInteger(saved.step)&&saved.step>=0&&saved.step<=2){
   settings={...p};step=saved.step;
   $("status").textContent="欢迎回来，已经找回你保存的进度。";
  }
 }
}catch{/* private browsing does not block the journey */}
render();
