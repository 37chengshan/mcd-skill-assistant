import { evaluatePerks,simulatePayable } from "./perk-engine.mjs";
// Fictional goods and fictional coupon conditions. No account, network, or redemption.
const foods=[
{id:"burger",name:"香煎鸡肉堡",price:25,category:"main"},
{id:"wrap",name:"鸡蛋卷",price:19,category:"main"},
{id:"corn",name:"香甜玉米杯",price:10,category:"side"},
{id:"tea",name:"清爽饮品",price:9,category:"drink"},
{id:"beef",name:"牛肉堡",price:27,category:"main"},
{id:"yogurt",name:"酸奶杯",price:12,category:"side"}
];
const perks=[
{id:"flat",title:"一餐满 35 元，减 8 元",type:"flat",minSpend:35,amount:8,day:"any",category:"any"},
{id:"main",title:"主餐满 40 元，减 10 元",type:"flat",minSpend:40,amount:10,day:"any",category:"main"},
{id:"weekend",title:"周末满 30 元，享八折",type:"percent",minSpend:30,rate:0.8,cap:12,day:"weekend",category:"any"},
{id:"corn",title:"小食满 20 元，减 6 元",type:"flat",minSpend:20,amount:6,day:"weekday",category:"side"}
];
const $=id=>document.getElementById(id),selected=new Set(["burger","tea"]);
let day="weekday",chosen=null;
const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function menuControls(){
 const area=$("menu");area.replaceChildren();
 for(const item of foods){
  const label=create("label","food"),checkbox=document.createElement("input");
  checkbox.type="checkbox";checkbox.checked=selected.has(item.id);
  checkbox.setAttribute("aria-label","选择"+item.name);
  checkbox.addEventListener("change",()=>{
   if(checkbox.checked)selected.add(item.id);else selected.delete(item.id);
   chosen=null;refresh();
  });
  const info=create("div");
  info.append(create("strong","",item.name),create("small","","参考价 ¥"+item.price));
  label.append(checkbox,info);area.append(label);
 }
}
function offerControls(result){
 const area=$("offers");area.replaceChildren();
 for(const perk of result.offers){
  const button=create("button","offer");button.type="button";
  button.disabled=!perk.eligible;
  button.setAttribute("aria-pressed",String(chosen===perk.id));
  const description=create("span");
  description.append(create("strong","",perk.title),
    create("small","",perk.eligible?"满足目前的演示条件":perk.reason));
  const tag=create("span","offer-tag"+(perk.eligible?"":" blocked"),
    perk.eligible?"省 ¥"+perk.savings.toFixed(0):"条件未满足");
  button.append(description,tag);
  button.addEventListener("click",()=>{chosen=chosen===perk.id?null:perk.id;refresh();});
  area.append(button);
 }
}
function drawReceipt(result){
 const container=$("basket");container.replaceChildren();
 $("dayLabel").textContent=day==="weekend"?"周末演示":"工作日演示";
 if(!result.basket.length)container.append(create("p","sub","先从左边挑几样餐品吧。"));
 for(const f of result.basket){
  const row=create("div","line");
  row.append(create("span","",f.name),create("span","","¥"+f.price.toFixed(0)));
  container.append(row);
 }
 const preview=simulatePayable(result,chosen);
 $("subtotal").textContent="¥"+result.subtotal.toFixed(0);
 $("discount").textContent="− ¥"+(preview.savings??0).toFixed(0);
 $("payable").textContent="¥"+(preview.payable??result.subtotal).toFixed(0);
 let text="暂时未选择任何优惠模拟情境。";
 if(chosen&&preview.status==="ok")text="如果满足这个演示条件，参考减少 ¥"+preview.savings.toFixed(0)+"。";
 else if(result.best)text="当前演示里，最多可以模拟省 ¥"+result.best.savings.toFixed(0)+"。请在左边挑一种试试。";
 $("saved").textContent=text;
}
function refresh(){
 const result=evaluatePerks(foods,[...selected],perks,{day});
 if(result.status!=="ok"){
  $("saved").textContent="当前示例暂时无法计算。";return;
 }
 if(chosen&&!result.offers.some(x=>x.id===chosen&&x.eligible))chosen=null;
 document.querySelectorAll("[data-day]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.day===day)));
 menuControls();offerControls(result);drawReceipt(result);
}
document.querySelectorAll("[data-day]").forEach(b=>b.addEventListener("click",()=>{day=b.dataset.day;chosen=null;refresh();}));
$("reset").addEventListener("click",()=>{selected.clear();selected.add("burger");selected.add("tea");day="weekday";chosen=null;refresh();});
refresh();
