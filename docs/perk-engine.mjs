// Offline scenario comparison only. This code cannot redeem a coupon, order or pay.
const days=new Set(["weekday","weekend"]);
const categories=new Set(["any","main","side","drink"]);
const money=n=>Math.round(n*100)/100;
const positive=n=>typeof n==="number"&&Number.isFinite(n)&&n>=0;
function validOffer(p){
 return p&&typeof p.id==="string"&&/^[a-z0-9_-]{1,40}$/i.test(p.id)&&
  typeof p.title==="string"&&p.title.length>0&&p.title.length<=80&&
  ["flat","percent"].includes(p.type)&&positive(p.minSpend)&&p.minSpend<=1000&&
  ["weekday","weekend","any"].includes(p.day)&&categories.has(p.category)&&
  (p.type==="flat"?(positive(p.amount)&&p.amount<=200):
    (positive(p.rate)&&p.rate>0&&p.rate<1&&positive(p.cap)&&p.cap<=200));
}
export function evaluatePerks(menu,selectedIds,perks,context={}){
 if(!Array.isArray(menu)||menu.length>50||!Array.isArray(selectedIds)||
    selectedIds.length>30||!Array.isArray(perks)||perks.length>60||
    !days.has(context.day)||!perks.every(validOffer))return {status:"invalid"};
 const products=new Map();
 for(const f of menu){
  if(!f||typeof f!=="object"||typeof f.id!=="string"||!f.id.trim()||
    typeof f.name!=="string"||!categories.has(f.category)||f.category==="any"||
    products.has(f.id))return {status:"invalid"};
  products.set(f.id,f);
 }
 if([...products.values()].some(x=>!positive(x.price)))return {status:"price-unavailable"};
 if(selectedIds.some(id=>!products.has(id))||new Set(selectedIds).size!==selectedIds.length)
  return {status:"invalid"};
 if(new Set(perks.map(x=>x.id)).size!==perks.length)return {status:"invalid"};
 const basket=selectedIds.map(id=>products.get(id));
 const subtotal=money(basket.reduce((sum,p)=>sum+p.price,0));
 const evaluated=perks.map(offer=>{
  const relevant=offer.category==="any"?basket:basket.filter(p=>p.category===offer.category);
  const applicableValue=money(relevant.reduce((sum,p)=>sum+p.price,0));
  let reason="";
  if(!basket.length)reason="先挑一些喜欢的餐品";
  else if(offer.day!=="any"&&offer.day!==context.day)reason="仅限"+(offer.day==="weekend"?"周末":"工作日")+"的演示情境";
  else if(applicableValue<offer.minSpend)reason=(offer.category==="main"?"主餐金额":
    offer.category==="side"?"小食金额":offer.category==="drink"?"饮品金额":"餐品金额")+
    "还差 ¥"+money(offer.minSpend-applicableValue).toFixed(0);
  const eligible=reason==="";
  let savings=0;
  if(eligible){
   savings=offer.type==="flat"?offer.amount:Math.min(offer.cap,applicableValue*(1-offer.rate));
   savings=money(Math.min(subtotal,applicableValue,savings));
  }
  return {id:offer.id,title:offer.title,eligible,reason,
    savings,payable:money(subtotal-savings),minimum:offer.minSpend,
    day:offer.day,category:offer.category};
 });
 const applicable=evaluated.filter(x=>x.eligible).sort((a,b)=>b.savings-a.savings||
   a.id.localeCompare(b.id));
 const best=applicable[0]??null;
 return {status:"ok",subtotal,payable:best?best.payable:subtotal,
   best,offers:evaluated,basket:basket.map(p=>({id:p.id,name:p.name,price:p.price,category:p.category})),
   notice:"优惠情境与价格全部为虚构演示。未验证真实活动、适用门店或个人领取资格。"};
}
export function simulatePayable(result,chosenId=null){
 if(!result||result.status!=="ok")return {status:"invalid"};
 if(chosenId===null)return {status:"ok",offer:null,savings:0,payable:result.subtotal};
 const offer=result.offers.find(x=>x.id===chosenId);
 if(!offer||!offer.eligible)return {status:"not-eligible"};
 return {status:"ok",offer:offer.id,savings:offer.savings,payable:offer.payable};
}
