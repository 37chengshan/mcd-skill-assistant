import {optimize} from "./engine.mjs";
import {createNutritionSnapshot,readNutritionSnapshot} from "./snapshot.mjs";
import {planGroup} from "./group-engine.mjs";
import {buildWeek} from "./week-engine.mjs";
import {buildChoiceMap} from "./map-engine.mjs";
import {evaluatePerks} from "./perk-engine.mjs";
import {previewJourney} from "./journey-engine.mjs";
import {createStoryCard} from "./story-engine.mjs";
import {accessibleSuggestions} from "./readable-engine.mjs";
// Computed, entirely public sample-only tour. Never requests an account or external API.
export function createShowcase(menu){
 if(!Array.isArray(menu)||!menu.length)return {status:"invalid"};
 try{
  const cleaned=readNutritionSnapshot(createNutritionSnapshot(menu));
  const people=Array.from({length:3},(_,i)=>({id:"p"+i,name:"朋友 "+(i+1),
   budget:45,maxCalories:900,minProtein:15,goal:["balanced","save","protein"][i],excludeIds:[]}));
  const group=planGroup(menu,people,{groupBudget:135});
  const week=buildWeek(menu,{budget:48,maxCalories:850,minProtein:15,variety:85,goal:"balanced"});
  const map=buildChoiceMap(menu,{budget:65,maxCalories:850,minProtein:0,maxItems:2});
  const voucher=evaluatePerks(menu.map((f,i)=>({id:f.id,name:f.name,price:f.price,
   category:i<2?"main":i===2?"side":"drink"})),
   menu.slice(0,2).map(x=>x.id),[
    {id:"demo",title:"示例满减",type:"flat",minSpend:35,amount:8,day:"any",category:"any"}
   ],{day:"weekday"});
  const guided=previewJourney(menu,{scene:"solo",goal:"balanced",budget:48,
   maxCalories:850,minProtein:15,variety:80,guests:2});
  const solo=optimize(menu,{budget:45,maxCalories:850,minProtein:15,maxItems:2});
  const first=solo.plans[0];
  const story=createStoryCard("solo",[{name:first.foods.join(" ＋ "),price:first.price,
   calories:first.calories,protein:first.protein}]);
  const reader=accessibleSuggestions(menu,{budget:45,maxCalories:850,minProtein:15},"en");
  if([group,week,map,voucher,guided,story,reader].some(x=>x.status!=="ok"))
    return {status:"no-options"};
  const provenance="以下数字仅为虚构演示，不代表真实菜单、价格或门店服务。";
  const chapters=[
   {id:"nutrition",title:"从餐品资料开始",eyebrow:"第一站 · 数据边界",
    summary:"把餐品营养信息整理成干净的本地资料。这里没有实时价格，也不会夹带私人账号信息。",
    highlights:[cleaned.foods.length+" 种示例餐品","价格未知 · 不会编造"],
    href:"./index.html",button:"打开单人挑选",provenance},
   {id:"group",title:"朋友们一起选",eyebrow:"第二站 · 朋友相聚",
    summary:""+group.memberCount+" 个人的希望一起考虑，每个人有自己的限制，整桌参考预算也不能超出。",
    highlights:["参与 "+group.memberCount+" 人","整桌示例 ¥"+group.total.toFixed(0)],
    href:"./group.html",button:"去安排一次聚餐",provenance},
   {id:"week",title:"七天不必吃一样",eyebrow:"第三站 · 一周灵感",
    summary:"为七次午餐分别安排参考搭配，每一天都能独立替换，还可以把方案留到下次继续看。",
    highlights:["7 次午餐",week.uniqueMeals+" 种不同搭配"],
    href:"./week.html",button:"去打开一周日历",provenance},
   {id:"map",title:"选择并没有唯一答案",eyebrow:"第四站 · 看清取舍",
    summary:"把参考花费、热量和蛋白质放进同一张图。点击任意两种搭配，看看不同选择的得与失。",
    highlights:[map.candidateCount+" 种候选",map.frontierSize+" 种各有优势"],
    href:"./map.html",button:"去看看选择地图",provenance},
   {id:"perks",title:"让优惠条件变明白",eyebrow:"第五站 · 先算再选",
    summary:"用虚构情境演示活动门槛和模拟金额：不是拥有真实优惠，也不是实际支付。",
    highlights:["已检查示例条件",voucher.best?"最多示例省 ¥"+voucher.best.savings.toFixed(0):"无适用示例优惠"],
    href:"./perk.html",button:"去试优惠小算盘",provenance},
   {id:"guide",title:"第一次来也能轻松用",eyebrow:"第六站 · 跟着心情",
    summary:"选择自己吃、朋友吃或安排一周，再一步步填写偏好。看得见真实运算出的演示结果。",
    highlights:["3 种生活场景",guided.cards.length+" 份推荐预览"],
    href:"./journey.html",button:"开始三步小旅程",provenance},
   {id:"offline",title:"断网也能继续体验",eyebrow:"第七站 · 随时好选",
    summary:"公开演示页面首次联网准备好后，可在断网时继续使用，并能手动清理离线内容。",
    highlights:["仅公开示例文件","支持清理离线内容"],
    href:"./index.html",button:"返回主页面",provenance},
   {id:"story",title:"把这一餐变成故事",eyebrow:"第八站 · 分享灵感",
    summary:"把自己的演示搭配变成原创排版的图片，下载时图片里仍写清楚是虚构展示。",
    highlights:[story.entries.length+" 份故事内容","图片自带来源说明"],
    href:"./story.html",button:"去做一张故事卡",provenance},
   {id:"readable",title:"让选择更容易看懂",eyebrow:"第九站 · 清晰阅读",
    summary:"切换中文或英文，增大文字、提高对比度；需要时主动点按朗读，不会自动播放声音。",
    highlights:["中文 / English","可主动朗读 "+reader.plans.length+" 份搭配"],
    href:"./readable.html",button:"打开清晰朗读版",provenance}
  ];
  return {status:"ok",chapters,disclaimer:provenance,version:"V11 演示候选版"};
 }catch{return {status:"invalid"};}
}
