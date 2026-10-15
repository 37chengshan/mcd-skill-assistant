import {accessibleSuggestions,readableLabels} from "./readable-engine.mjs";
// An accessible companion, based only on fictional food and no user account data.
const foods=[
{id:"a",name:"香煎鸡肉堡",nameEn:"Chicken sandwich",calories:360,protein:24,price:22},
{id:"b",name:"玉米小杯",nameEn:"Sweet corn cup",calories:90,protein:3,price:10},
{id:"c",name:"牛肉堡",nameEn:"Beef sandwich",calories:410,protein:22,price:23},
{id:"d",name:"田园沙拉",nameEn:"Garden salad",calories:60,protein:2,price:12},
{id:"e",name:"无糖饮品",nameEn:"Sugar-free drink",calories:0,protein:0,price:9},
{id:"f",name:"烤鸡卷",nameEn:"Chicken wrap",calories:320,protein:20,price:20},
{id:"g",name:"酸奶",nameEn:"Yogurt",calories:130,protein:8,price:12},
{id:"h",name:"鸡蛋三明治",nameEn:"Egg sandwich",calories:280,protein:16,price:18}
];
const TEXT={
 zh:{skip:"直接开始",brand:"麦麦好选",back:"返回普通页面 →",
 headline:"看得更清楚，选得更自在。",intro:"可以用更大的文字、清晰的颜色和朗读功能，慢慢找到自己想要的一餐。",
 larger:"Aa 放大文字",contrast:"◐ 清晰对比",preferences:"先说说你的希望",preferencesHint:"这些数值只是演示参考，可以随时调整。",
 budget:"参考预算上限",calories:"热量不超过",protein:"蛋白质至少",
 results:"这些搭配可以考虑",resultsHint:"每份都能单独点一下朗读，不会突然自动播放。",
 disclaimer:"全部是虚构示例，非官方菜单、价格或营养建议。",speak:"▶ 朗读这一份",
 stop:"■ 停止朗读",reset:"重置阅读设置",status:"你可以用鼠标、触屏或键盘操作。",
 footer:"麦麦好选 · 独立创意作品，不是麦当劳官方服务。",
 notSupported:"当前浏览器不支持语音朗读，可以直接阅读文字。",
 playing:"正在朗读，随时可以停止。",stopped:"已停止朗读。",noResults:"暂时没有合适搭配，请放宽条件。"},
 en:{skip:"Skip to choices",brand:"Meal Ideas",back:"Back to the main page →",
 headline:"See clearly. Choose comfortably.",intro:"Larger text, clearer contrast and optional spoken guidance help you choose at your own pace.",
 larger:"Aa Larger text",contrast:"◐ High contrast",preferences:"Your preferences",preferencesHint:"These values are fictional examples. Adjust any time.",
 budget:"Budget limit",calories:"Energy limit",protein:"Minimum protein",
 results:"Meals to consider",resultsHint:"Tap the speak button on a meal. Audio never starts by itself.",
 disclaimer:"These are fictional examples, not an official menu, price quote or nutrition advice.",
 speak:"▶ Read this aloud",stop:"■ Stop speaking",reset:"Reset reading settings",
 status:"Use your keyboard, touch screen, or mouse.",
 footer:"Meal Ideas · Independent creative project, not an official McDonald's service.",
 notSupported:"Voice playback is not supported here. Text remains available.",
 playing:"Speaking now. You can stop at any time.",stopped:"Speech stopped.",
 noResults:"No meal matches these limits. Try relaxing your preferences."}
};
const $=id=>document.getElementById(id);
let language="zh",large=false,contrast=false,budget=45,maxCalories=850,minProtein=20;
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function stopSpeech(){if("speechSynthesis" in window)window.speechSynthesis.cancel();}
function persist(){
 try{localStorage.setItem("mcdecision-reading-options",JSON.stringify({language,large,contrast}));}catch{}
}
function renderLabels(){
 document.documentElement.lang=language==="en"?"en":"zh-CN";
 document.querySelectorAll("[data-i18n]").forEach(x=>{
  const key=x.dataset.i18n;if(TEXT[language][key])x.textContent=TEXT[language][key];
 });
 document.body.classList.toggle("large",large);
 document.body.classList.toggle("contrast",contrast);
 $("language").textContent=language==="zh"?"🌐 中文 / English":"🌐 English / 中文";
 $("language").setAttribute("aria-pressed",String(language==="en"));
 $("largeText").setAttribute("aria-pressed",String(large));
 $("contrast").setAttribute("aria-pressed",String(contrast));
}
function renderPlans(){
 const v=accessibleSuggestions(foods,{budget,maxCalories,minProtein},language);
 const panel=$("cards");panel.replaceChildren();
 const t=TEXT[language];
 if(v.status!=="ok"){panel.append(node("p","sub",t.noResults));return;}
 for(const plan of v.plans){
  const card=node("article","result");
  card.append(node("div","result-title",plan.title),
    node("p","",plan.price+" · "+plan.spokenFacts));
  const speak=node("button","speak",t.speak);
  speak.type="button";
  if(!("speechSynthesis" in window))speak.disabled=true;
  speak.addEventListener("click",()=>{
   if(!("speechSynthesis" in window)){$("status").textContent=t.notSupported;return;}
   stopSpeech();
   const message=new SpeechSynthesisUtterance(plan.speech);
   message.lang=language==="en"?"en-US":"zh-CN";message.rate=.85;
   window.speechSynthesis.speak(message);
   $("status").textContent=t.playing;
  });
  card.append(speak);panel.append(card);
 }
}
function redraw(){
 stopSpeech();renderLabels();
 $("budgetValue").textContent=language==="en"?budget+" yuan":"¥"+budget;
 $("caloriesValue").textContent=maxCalories+(language==="en"?" kcal":" 千卡");
 $("proteinValue").textContent=minProtein+(language==="en"?" g":" 克");
 $("budget").value=budget;$("calories").value=maxCalories;$("protein").value=minProtein;
 renderPlans();
}
$("language").addEventListener("click",()=>{language=language==="zh"?"en":"zh";persist();redraw();});
$("largeText").addEventListener("click",()=>{large=!large;persist();redraw();});
$("contrast").addEventListener("click",()=>{contrast=!contrast;persist();redraw();});
for(const [id,name] of [["budget","budget"],["calories","maxCalories"],["protein","minProtein"]]){
 $(id).addEventListener("input",()=>{const value=Number($(id).value);
  if(name==="budget")budget=value;else if(name==="maxCalories")maxCalories=value;else minProtein=value;
  redraw();
 });
}
$("stop").addEventListener("click",()=>{stopSpeech();$("status").textContent=TEXT[language].stopped;});
$("clear").addEventListener("click",()=>{
 stopSpeech();language="zh";large=false;contrast=false;persist();redraw();
 $("status").textContent=TEXT[language].status;
});
try{
 const raw=localStorage.getItem("mcdecision-reading-options");
 if(raw&&raw.length<200){
  const saved=JSON.parse(raw);
  if(["zh","en"].includes(saved.language)&&typeof saved.large==="boolean"&&
     typeof saved.contrast==="boolean"){
    language=saved.language;large=saved.large;contrast=saved.contrast;
  }
 }
}catch{}
redraw();
