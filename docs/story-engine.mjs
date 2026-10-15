// Small, strict and standalone story-data contract. No account or network fields.
const MODES=[
 {id:"solo",label:"一个人的灵感",title:"今天就这么吃",subtitle:"这份搭配，有自己的理由",accent:"#e5aa1c"},
 {id:"group",label:"朋友们的选择",title:"一起吃，更有意思",subtitle:"每个人都有自己的好选择",accent:"#397455"},
 {id:"week",label:"一周小灵感",title:"七天有七种期待",subtitle:"给这一周一点新鲜感",accent:"#5770a2"}
];
export function storyModes(){return MODES.map(({id,label})=>({id,label}));}
function clean(item){
 if(!item||typeof item!=="object"||typeof item.name!=="string"||
    !item.name.trim()||item.name.length>60||/[<>@\x00-\x1f]/.test(item.name)||
    typeof item.calories!=="number"||!Number.isFinite(item.calories)||
    item.calories<0||item.calories>5000||
    typeof item.protein!=="number"||!Number.isFinite(item.protein)||
    item.protein<0||item.protein>300||
    (item.price!==null && (typeof item.price!=="number"||
    !Number.isFinite(item.price)||item.price<0||item.price>2000)))return null;
 return {name:item.name.trim().slice(0,55),price:item.price,
   calories:item.calories,protein:item.protein};
}
export function createStoryCard(mode,items){
 const preset=MODES.find(x=>x.id===mode);
 if(!preset||!Array.isArray(items)||items.length<1||items.length>7)return {status:"invalid"};
 const rows=items.map(clean);
 if(rows.some(x=>!x))return {status:"invalid"};
 const total=rows.every(x=>x.price!==null)?
   Math.round(rows.reduce((sum,x)=>sum+x.price,0)*100)/100:null;
 const entries=rows.map((f,index)=>({
   label:mode==="group"?"第 "+(index+1)+" 位":"第 "+(index+1)+" 份",
   name:f.name,
   secondary:(f.price===null?"价格未知":"参考 ¥"+f.price.toFixed(0))+
     " · "+Math.round(f.calories)+" 千卡 · 蛋白质 "+f.protein.toFixed(1)+" 克"
 }));
 const disclaimer=["所有名称、营养与价格均为虚构演示","非官方菜单或优惠，不能据此下单"];
 const headline=total===null?"部分参考价格未知":"样例参考合计 ¥"+total.toFixed(0);
 const story={status:"ok",mode,title:preset.title,subtitle:preset.subtitle,accent:preset.accent,
   headline,entries,disclaimer,
   shareText:["【麦麦好选 · 演示故事卡】",preset.title,...entries.map(x=>x.label+"："+x.name+" / "+x.secondary),
     headline,...disclaimer].join("\n")};
 return story;
}
