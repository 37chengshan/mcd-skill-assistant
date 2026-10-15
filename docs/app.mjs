import { optimize } from "./engine.mjs";
// Intentionally fictional. Browser demo NEVER calls McDonald's MCP or stores a token.
const catalog = [
  {name:"香煎鸡肉堡（虚构样例）",calories:360,protein:24,price:22},
  {name:"玉米杯（虚构样例）",calories:90,protein:3,price:10},
  {name:"牛肉堡（虚构样例）",calories:410,protein:22,price:23},
  {name:"小份沙拉（虚构样例）",calories:60,protein:2,price:12},
  {name:"无糖饮品（虚构样例）",calories:0,protein:0,price:9},
  {name:"烤鸡卷（虚构样例）",calories:320,protein:20,price:20},
  {name:"酸奶（虚构样例）",calories:130,protein:8,price:12},
  {name:"鸡蛋三明治（虚构样例）",calories:280,protein:16,price:18}
];
const $ = id => document.getElementById(id);
const presets = {
  balanced: {budget:45,calories:850,protein:25},
  save: {budget:28,calories:750,protein:20},
  protein: {budget:65,calories:950,protein:45}
};
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function metric(label, value) {
  const node=el("div","metric"), strong=el("strong","",value), small=el("span","",label);
  node.append(strong,small);return node;
}
function render() {
  const budget=Number($("budget").value), maxCalories=Number($("calories").value);
  const minProtein=Number($("protein").value);
  $("budgetValue").textContent="¥"+budget;
  $("caloriesValue").textContent=maxCalories+" kcal";
  $("proteinValue").textContent=minProtein+" g";
  const outcome=optimize(catalog,{budget,maxCalories,minProtein,limit:5,source:"illustrative"});
  const cards=$("cards");cards.replaceChildren();
  $("stats").replaceChildren(
    el("span","",outcome.catalogSize+" 个虚构样例"),
    el("span","",outcome.eligible+" 个可行组合"),
    el("span","",outcome.frontierSize+" 个非支配组合"));
  if (!outcome.plans.length) {
    cards.append(el("div","empty","当前条件下没有可行组合。试着提高预算、放宽热量或降低蛋白质目标。"));
    return;
  }
  for (const plan of outcome.plans) {
    const card=el("article","plan"), top=el("div","top");
    top.append(el("span","rank",plan.rank===1?"TOP CHOICE":"OPTION "+plan.rank),el("span","small","虚构样例"));
    const title=el("h3","",plan.foods.join(" + "));
    const metrics=el("div","metrics");
    metrics.append(metric("样例参考价","¥"+plan.price.toFixed(0)),
      metric("能量",Math.round(plan.calories)+" kcal"),
      metric("蛋白质",plan.protein.toFixed(1)+" g"));
    const why=el("p","why","方案依据：" + plan.reason + "。满足当前设定的约束，不代表医学建议或真实价格。");
    const bar=el("div","bar"), fill=el("div","fill");
    fill.style.width=Math.max(0,Math.min(100,100*plan.calories/maxCalories))+"%";
    bar.append(fill);
    const actions=el("div","actions"), copy=el("button","","复制方案");
    copy.type="button";
    copy.addEventListener("click",async()=>{
      const text="【虚构数据演示】"+plan.foods.join(" + ")+"；"+plan.reason;
      try {await navigator.clipboard.writeText(text);copy.textContent="已复制 ✓";}
      catch {copy.textContent="浏览器未授权复制";}
    });
    actions.append(copy);card.append(top,title,metrics,why,bar,actions);cards.append(card);
  }
}
for (const food of catalog) {
  const card=el("div","food");
  card.append(el("b","",food.name),el("span","",food.calories+" kcal / ¥"+food.price));
  $("catalog").append(card);
}
for (const id of ["budget","calories","protein"]) {
  $(id).addEventListener("input",()=>{
    for(const btn of document.querySelectorAll("[data-preset]"))btn.classList.remove("active");
    render();
  });
}
for (const button of document.querySelectorAll("[data-preset]")) {
  button.addEventListener("click",()=>{
    const config=presets[button.dataset.preset];
    for (const [id,value] of Object.entries(config)) $(id).value=value;
    document.querySelectorAll("[data-preset]").forEach(b=>b.classList.remove("active"));
    button.classList.add("active");render();
  });
}
render();
