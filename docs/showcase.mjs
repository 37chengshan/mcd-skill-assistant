import {createShowcase} from "./showcase-engine.mjs";
// Reviewers need no account or network data: only the illustrative fixture.
const menu=[
{id:"a",name:"香煎鸡肉堡",nameEn:"Chicken sandwich",calories:360,protein:24,price:22},
{id:"b",name:"玉米小杯",nameEn:"Corn cup",calories:90,protein:3,price:10},
{id:"c",name:"牛肉堡",nameEn:"Beef sandwich",calories:410,protein:22,price:23},
{id:"d",name:"田园沙拉",nameEn:"Garden salad",calories:60,protein:2,price:12},
{id:"e",name:"无糖饮品",nameEn:"Sugar-free drink",calories:0,protein:0,price:9},
{id:"f",name:"烤鸡卷",nameEn:"Chicken wrap",calories:320,protein:20,price:20},
{id:"g",name:"酸奶",nameEn:"Yogurt",calories:130,protein:8,price:12},
{id:"h",name:"鸡蛋三明治",nameEn:"Egg sandwich",calories:280,protein:16,price:18}
];
const $=id=>document.getElementById(id);
const icons=["🥗","👥","🗓️","🎯","🎟️","✨","📱","💌","◐"];
const tour=createShowcase(menu);
let stage=0;
function make(tag,cls,text){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;
 return e;
}
function paint(){
 if(tour.status!=="ok"||!tour.chapters.length){
  $("chapterSummary").textContent="演示暂时无法载入，请尝试刷新页面。";
  $("visitTool").hidden=true;
  $("next").disabled=true;$("previous").disabled=true;
  return;
 }
 const chapter=tour.chapters[stage];
 $("chapterEyebrow").textContent=chapter.eyebrow;
 $("chapterCounter").textContent=String(stage+1).padStart(2,"0")+" / "+
   String(tour.chapters.length).padStart(2,"0");
 $("chapterTitle").textContent=chapter.title;
 $("chapterSummary").textContent=chapter.summary;
 $("symbol").textContent=icons[stage]||"🍔";
 $("sourceNote").textContent=chapter.provenance;
 $("visitTool").href=chapter.href;
 $("visitTool").textContent=chapter.button+" ↗";
 $("progressLabel").textContent="第 "+(stage+1)+" / "+tour.chapters.length+" 站";
 $("fill").style.width=((stage+1)/tour.chapters.length*100)+"%";
 $("progress").setAttribute("aria-valuenow",String(stage+1));
 $("previous").disabled=stage===0;
 $("next").textContent=stage===tour.chapters.length-1?"从头再逛一次 ↺":"下一站 →";
 const facts=$("highlights");facts.replaceChildren();
 for(const highlight of chapter.highlights)facts.append(make("div","fact",highlight));
 const navigation=$("chapterList");navigation.replaceChildren();
 tour.chapters.forEach((item,i)=>{
  const button=make("button","chapter");
  button.type="button";button.setAttribute("aria-current",i===stage?"step":"false");
  button.append(make("span","num",String(i+1)),
    make("strong","",item.title));
  button.addEventListener("click",()=>show(i,true));
  navigation.append(button);
 });
}
function show(index,focus=false){
 stage=Math.min(Math.max(index,0),tour.chapters.length-1);
 paint();
 if(focus)$("chapterTitle").focus({preventScroll:true});
 $("status").textContent="现在是第 "+(stage+1)+" 站；可以按“亲自试试看”进入完整页面。";
}
$("previous").addEventListener("click",()=>show(stage-1,true));
$("next").addEventListener("click",()=>{
 if(stage===tour.chapters.length-1)show(0,true);else show(stage+1,true);
});
$("copyIntro").addEventListener("click",async()=>{
 if(tour.status!=="ok")return;
 const c=tour.chapters[stage];
 const words=["【麦麦好选 · 仅供演示】",c.title,c.summary,
   ...c.highlights,c.provenance,
   "作品：https://github.com/37chengshan/mcd-skill-assistant"].join("\n");
 try{await navigator.clipboard.writeText(words);
   $("status").textContent="这一站的介绍已经复制，可以分享给朋友。";
 }catch{
   $("status").textContent="当前浏览器无法自动复制，你仍可以手动选中文字。";
 }
});
show(0);
