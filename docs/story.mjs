import {createStoryCard,storyModes} from "./story-engine.mjs";
import {optimize} from "./engine.mjs";
import {planGroup} from "./group-engine.mjs";
import {buildWeek} from "./week-engine.mjs";
// The input is intentionally fixed demo data; never accepts private account information.
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
const $=id=>document.getElementById(id),modes=storyModes();
let mode="solo",index=0,story=null;
function storySource(){
 if(mode==="solo"){
  const r=optimize(menu,{budget:50,maxCalories:800,minProtein:20,maxItems:2,limit:10});
  if(!r.plans.length)return [];
  const p=r.plans[index%r.plans.length];
  return [{name:p.foods.join(" ＋ "),price:p.price,calories:p.calories,protein:p.protein}];
 }
 if(mode==="group"){
  const people=Array.from({length:3},(_,i)=>({id:"guest"+i,
   name:"朋友"+i,budget:45,maxCalories:800,minProtein:16,goal:["protein","save","light"][i],excludeIds:[]}));
  const r=planGroup(menu,people,{groupBudget:130});
  return r.status==="ok"?r.selections.map(x=>({
    name:x.foods.join(" ＋ "),price:x.price,calories:x.calories,protein:x.protein})): [];
 }
 const r=buildWeek(menu,{budget:48,maxCalories:850,minProtein:18,variety:90,goal:"balanced"});
 return r.status==="ok"?r.days.map(x=>({
   name:x.day+" · "+x.foods.join(" ＋ "),price:x.price,calories:x.calories,protein:x.protein})): [];
}
const fit=(context,raw,maxWidth)=>{
 let s=raw;
 while(s.length>1&&context.measureText(s).width>maxWidth)s=s.slice(0,-1);
 return s===raw?s:s+"…";
};
function rounded(context,x,y,w,h,r){
 context.beginPath();context.roundRect(x,y,w,h,r);context.fill();
}
function draw(){
 const canvas=$("storyCanvas"),ctx=canvas.getContext("2d");
 if(!ctx||!story||story.status!=="ok")return;
 const width=canvas.width,height=canvas.height;
 const bg=ctx.createLinearGradient(0,0,width,height);
 bg.addColorStop(0,"#fff9e9");bg.addColorStop(1,"#f5f3e7");
 ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 ctx.fillStyle=story.accent;ctx.beginPath();ctx.arc(915,180,180,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#fff0b6";ctx.beginPath();ctx.arc(140,1170,155,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#292e27";ctx.font="900 33px system-ui,sans-serif";
 ctx.fillText("✳  麦麦好选",75,105);
 ctx.fillStyle=story.accent;ctx.font="900 27px system-ui,sans-serif";
 ctx.fillText("TODAY'S LITTLE STORY",75,174);
 ctx.fillStyle="#252b25";ctx.font="900 76px system-ui,sans-serif";
 ctx.fillText(fit(ctx,story.title,850),75,285);
 ctx.fillStyle="#6e7163";ctx.font="29px system-ui,sans-serif";
 ctx.fillText(fit(ctx,story.subtitle,835),77,345);
 ctx.fillStyle="#ffffff";rounded(ctx,65,395,950,Math.max(260,Math.min(690,180+story.entries.length*95)),30);
 const rowY=445,rowGap=story.entries.length<=3?125:90;
 for(let i=0;i<story.entries.length;i++){
  const item=story.entries[i],y=rowY+i*rowGap;
  ctx.fillStyle=story.accent;ctx.beginPath();ctx.arc(115,y+17,18,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#31372d";ctx.font="bold 30px system-ui,sans-serif";
  ctx.fillText(fit(ctx,item.name,795),160,y+13);
  ctx.fillStyle="#77796d";ctx.font="23px system-ui,sans-serif";
  ctx.fillText(fit(ctx,item.secondary,795),160,y+50);
 }
 const noteY=story.entries.length>=5?1110:920;
 ctx.fillStyle="#324f3b";ctx.font="900 36px system-ui,sans-serif";
 ctx.fillText(fit(ctx,story.headline,900),80,noteY);
 ctx.fillStyle="#665e47";ctx.font="27px system-ui,sans-serif";
 ctx.fillText("※ "+story.disclaimer[0],80,1188);
 ctx.fillText("※ "+story.disclaimer[1],80,1240);
 ctx.fillStyle="#7c7c6f";ctx.font="21px system-ui,sans-serif";
 ctx.fillText("独立创意作品 · 仅供体验",80,1300);
}
function renderMode(){
 const area=$("scenes");area.replaceChildren();
 for(const item of modes){
  const b=document.createElement("button");b.type="button";b.className="scene";
  b.setAttribute("aria-pressed",String(item.id===mode));
  const title=document.createElement("span"),icon=document.createElement("span");
  title.textContent=item.label;icon.textContent=item.id==="solo"?"🍔":item.id==="group"?"👥":"🗓";
  b.append(title,icon);b.addEventListener("click",()=>{mode=item.id;index=0;render();});
  area.append(b);
 }
}
function render(){
 story=createStoryCard(mode,storySource());
 renderMode();
 if(story.status!=="ok"){$("status").textContent="这次没有找到可分享的搭配。";return;}
 $("storyText").textContent=story.shareText;
 $("storyCanvas").setAttribute("aria-label",story.shareText.replaceAll("\n","；"));
 draw();
 $("status").textContent="卡片已生成。下载时会保留演示说明。";
}
$("shuffle").addEventListener("click",()=>{index++;render();});
$("copy").addEventListener("click",async()=>{
 if(!story||story.status!=="ok")return;
 try{await navigator.clipboard.writeText(story.shareText);$("status").textContent="文字版已复制。";}
 catch{$("status").textContent="复制未成功，可以展开下方文字版手动复制。";}
});
$("download").addEventListener("click",()=>{
 if(!story||story.status!=="ok")return;
 const canvas=$("storyCanvas");
 canvas.toBlob(blob=>{
  if(!blob){$("status").textContent="暂时无法保存图片，请尝试复制文字版。";return;}
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="麦麦好选-虚构演示故事卡.png";
  a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  $("status").textContent="图片已准备好保存，演示说明保留在图片上。";
 },"image/png");
});
const urlMode=new URLSearchParams(window.location.search).get("s");
if(modes.some(x=>x.id===urlMode))mode=urlMode;
render();
