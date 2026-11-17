/* 前端面试复习手册 —— 纯前端应用 */
'use strict';

const DATA_URL = 'data/questions.json';
const STORE_KEY = 'fe-interview-review-v1';
const THEME_KEY = 'fe-interview-theme';

let DATA = null;           // { questions, answers, categories }
let state = { mastery:{}, filter:'all', query:'', open:new Set(), activeCat:null };

/* ---------- 工具 ---------- */
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e=document.createElement(tag); if(cls)e.className=cls; if(html!==undefined)e.innerHTML=html; return e; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function loadState(){
  try{ const s=JSON.parse(localStorage.getItem(STORE_KEY)||'{}'); state.mastery=s.mastery||{}; }catch(e){}
  const t=localStorage.getItem(THEME_KEY);
  if(t==='dark') document.documentElement.dataset.theme='dark';
}
function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify({mastery:state.mastery})); }

/* ---------- 极简 Markdown 渲染 ---------- */
function highlight(code, lang){
  code = esc(code);
  // 注释（行 // ... 或 /* */）先占位；用纯字母数字占位符，但避免被后续正则误伤
  const stash=[];
  const ph = n => 'STX'+String.fromCharCode(65+(n>>6)%26)+String.fromCharCode(65+n%26)+'XEH';
  code=code.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g, m=>{ const i=stash.push(m)-1; return ph(i); });
  // 字符串
  code=code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,'<span class="str">$1</span>');
  // 关键字
  const kw='const|let|var|function|return|if|else|for|while|do|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|import|export|from|default|async|await|yield|try|catch|finally|throw|switch|case|delete|void|static|get|set|interface|type|enum|implements|public|private|protected|readonly|as|is|keyof|infer|declare|namespace|module';
  code=code.replace(new RegExp('\\b('+kw+')\\b','g'),'<span class="kw">$1</span>');
  // 数字
  code=code.replace(/\b(\d+\.?\d*)\b/g,'<span class="num">$1</span>');
  // 函数名
  code=code.replace(/\b([A-Za-z_$][\w$]*)(?=\s*\()/g,'<span class="fun">$1</span>');
  // 还原注释
  code=code.replace(/STX([A-Z])([A-Z])XEH/g,(m,a,b)=>'<span class="com">'+stash[(a.charCodeAt(0)-65)*26+(b.charCodeAt(0)-65)]+'</span>');
  return code;
}

function mdRender(src){
  if(!src) return '';
  const lines=src.split('\n');
  let out='', i=0, inList=false;
  const closeList=()=>{ if(inList){ out+='</ul>'; inList=false; } };
  while(i<lines.length){
    let ln=lines[i];
    // 代码块
    if(/^```/.test(ln.trim())){
      closeList();
      const lang=ln.trim().slice(3).trim()||'code';
      const buf=[];
      i++;
      while(i<lines.length && !/^```/.test(lines[i].trim())){ buf.push(lines[i]); i++; }
      i++; // skip closing
      out+='<pre data-lang="'+esc(lang)+'"><code>'+highlight(buf.join('\n'),lang)+'</code></pre>';
      continue;
    }
    // 标题：匹配 "1.2.1. xxx" -> h3/h4/h5；基于点的层级
    const h=ln.match(/^(\d+(?:\.\d+)*)\.\s+(.+)$/);
    if(h){
      closeList();
      const depth=h[1].split('.').length;
      const tag = depth<=2?'h3':depth===3?'h4':'h5';
      out+='<'+tag+'>'+esc(h[2].trim())+'</'+tag+'>';
      i++; continue;
    }
    // 列表
    if(/^-\s+/.test(ln.trim())){
      if(!inList){ out+='<ul>'; inList=true; }
      out+='<li>'+inline(ln.trim().replace(/^-\s+/,''))+'</li>';
      i++; continue;
    }
    // 空行
    if(ln.trim()===''){ closeList(); i++; continue; }
    // 普通段落（合并连续行）
    closeList();
    let para=[ln.trim()]; i++;
    while(i<lines.length){
      const nx=lines[i].trim();
      if(nx==='' || /^```/.test(nx) || /^-\s+/.test(nx) || /^\d+(?:\.\d+)*\.\s+/.test(nx)) break;
      para.push(nx); i++;
    }
    out+='<p>'+para.map(inline).join('<br>')+'</p>';
  }
  closeList();
  return out;
}
function inline(s){
  s=esc(s);
  // 行内代码
  s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
  // 加粗
  s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  return s;
}

/* ---------- 渲染 ---------- */
function categoryOf(catName){ return DATA.categories.find(c=>c.name===catName); }

function renderNav(){
  const nav=$('#navList'); nav.innerHTML='';
  const {questions,categories}=DATA;
  const q=state.query.toLowerCase();
  let visibleIds=null;
  if(q){
    visibleIds=new Set();
    questions.forEach(x=>{
      if((x.title+' '+x.cat+' '+(DATA.answers[x.id]||'')).toLowerCase().includes(q)) visibleIds.add(x.id);
    });
  }
  categories.forEach(cat=>{
    let qs=questions.filter(x=>x.cat===cat.name);
    if(state.filter==='todo') qs=qs.filter(x=>!state.mastery[x.id]);
    else if(state.filter==='fuzzy') qs=qs.filter(x=>state.mastery[x.id]==='fuzzy');
    else if(state.filter==='mastered') qs=qs.filter(x=>state.mastery[x.id]==='mastered');
    if(visibleIds) qs=qs.filter(x=>visibleIds.has(x.id));
    if(!qs.length) return;
    const box=el('div','nav-cat');
    const open = q ? true : (state.activeCat===cat.name || (!state.activeCat && cat.name===categories[0].name));
    if(open) box.classList.add('open');
    const head=el('button','nav-cat-head');
    head.innerHTML=`<span class="cat-icon">${cat.icon}</span><span class="cat-name">${esc(cat.name)}</span><span class="cat-count">${qs.length}</span><svg class="chev" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>`;
    head.onclick=()=>{ box.classList.toggle('open'); if(box.classList.contains('open')) state.activeCat=cat.name; };
    box.appendChild(head);
    const list=el('div','nav-questions');
    qs.forEach(x=>{
      const item=el('button','nav-q');
      item.dataset.id=x.id;
      const m=state.mastery[x.id];
      const dot=m==='mastered'?'s-mastered':m==='fuzzy'?'s-fuzzy':'';
      item.innerHTML=`<span class="qnum">${String(x.num).padStart(2,'0')}</span><span class="qtitle">${esc(x.title)}</span><span class="qdot ${dot}"></span>`;
      item.onclick=()=>{ gotoQuestion(x.id); if(window.innerWidth<=760) closeSidebar(); };
      list.appendChild(item);
    });
    box.appendChild(list); nav.appendChild(box);
  });
}

function filteredQuestions(){
  const q=state.query.toLowerCase();
  let qs=DATA.questions.slice();
  if(state.filter==='todo') qs=qs.filter(x=>!state.mastery[x.id]);
  else if(state.filter==='fuzzy') qs=qs.filter(x=>state.mastery[x.id]==='fuzzy');
  else if(state.filter==='mastered') qs=qs.filter(x=>state.mastery[x.id]==='mastered');
  if(q) qs=qs.filter(x=>(x.title+' '+x.cat+' '+(DATA.answers[x.id]||'')).toLowerCase().includes(q));
  return qs;
}

function renderContent(){
  const inner=$('#contentInner'); inner.innerHTML='';
  const qs=filteredQuestions();

  // 页头
  const head=el('div','page-head');
  if(state.query){
    head.innerHTML=`<div class="page-kicker">🔍 搜索结果</div><h1 class="page-title">“${esc(state.query)}”</h1><p class="page-desc">找到 ${qs.length} 道相关题目</p>`;
  } else {
    const filterName={all:'全部题目',todo:'未学题目',fuzzy:'模糊题目',mastered:'已掌握题目'}[state.filter];
    head.innerHTML=`<div class="page-kicker">📚 2025 前端高频面试题</div><h1 class="page-title">${filterName}</h1><p class="page-desc">共 ${qs.length} 道题 · 点击题目展开答案 · 标记掌握度追踪复习进度</p>`;
  }
  inner.appendChild(head);

  const bar=el('div','section-bar');
  bar.innerHTML=`<h2>题目列表</h2><span class="view-tip">提示：按 <kbd>/</kbd> 快速搜索，<kbd>Esc</kbd> 清除</span>`;
  inner.appendChild(bar);

  if(!qs.length){
    const e=el('div','empty');
    e.innerHTML=`<div class="empty-icon">🎉</div><h3>这里空空如也</h3><p>当前筛选条件下没有题目，换个条件试试吧</p>`;
    inner.appendChild(e); return;
  }

  qs.forEach(x=>{
    const card=el('div','q-card');
    card.dataset.id=x.id;
    if(state.open.has(x.id)) card.classList.add('expanded');
    const m=state.mastery[x.id]||'todo';
    const headRow=el('div','q-head');
    headRow.innerHTML=`<span class="q-index">${String(x.num).padStart(2,'0')}</span>
      <div style="flex:1;min-width:0">
        <div class="q-title-text">${esc(x.title)}</div>
        <div class="q-meta"><span class="q-tag">${esc(categoryOf(x.cat)?.icon||'📘')} ${esc(x.cat)}</span><span class="q-tag">P${x.page}</span></div>
      </div>
      <div class="mastery" data-id="${x.id}">
        <button data-m="todo" class="${m==='todo'||!state.mastery[x.id]?'on-t':''}">未学</button>
        <button data-m="fuzzy" class="${m==='fuzzy'?'on-f':''}">模糊</button>
        <button data-m="mastered" class="${m==='mastered'?'on-m':''}">掌握</button>
      </div>
      <svg class="q-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>`;
    headRow.querySelector('.q-title-text').onclick=()=>toggleCard(card,x.id);
    headRow.querySelector('.q-index').onclick=()=>toggleCard(card,x.id);
    headRow.querySelector('.q-chev').onclick=()=>toggleCard(card,x.id);
    const mastery=headRow.querySelector('.mastery');
    mastery.querySelectorAll('button').forEach(b=>{
      b.onclick=(ev)=>{
        ev.stopPropagation();
        const val=b.dataset.m;
        if(state.mastery[x.id]===val) delete state.mastery[x.id]; else state.mastery[x.id]=val;
        saveState(); updateMasteryUI(card,x.id); updateProgress(); renderNav();
        // 如果当前筛选下该题不再符合条件，移除卡片
        if(!matchesFilter(x)){ card.style.transition='opacity .2s'; card.style.opacity='0'; setTimeout(()=>card.remove(),200); }
      };
    });
    card.appendChild(headRow);
    const body=el('div','q-body');
    const md=el('div','md');
    md.innerHTML=mdRender(DATA.answers[x.id]||'（暂无答案内容）');
    body.appendChild(md);
    card.appendChild(body);
    inner.appendChild(card);
  });
}

function matchesFilter(x){
  if(state.filter==='todo') return !state.mastery[x.id];
  if(state.filter==='fuzzy') return state.mastery[x.id]==='fuzzy';
  if(state.filter==='mastered') return state.mastery[x.id]==='mastered';
  return true;
}
function updateMasteryUI(card,id){
  const m=state.mastery[id]||'todo';
  const box=card.querySelector('.mastery'); if(!box) return;
  box.querySelector('[data-m="todo"]').className = (!state.mastery[id]||m==='todo')?'on-t':'';
  box.querySelector('[data-m="fuzzy"]').className = m==='fuzzy'?'on-f':'';
  box.querySelector('[data-m="mastered"]').className = m==='mastered'?'on-m':'';
  const dot=card.querySelector('.nav-q .qdot');
  if(dot){ dot.className='qdot '+(m==='mastered'?'s-mastered':m==='fuzzy'?'s-fuzzy':''); }
  // sync sidebar dot
  document.querySelectorAll(`.nav-q[data-id="${id}"] .qdot`).forEach(d=>{
    d.className='qdot '+(m==='mastered'?'s-mastered':m==='fuzzy'?'s-fuzzy':'');
  });
}
function toggleCard(card,id){
  const ex=card.classList.toggle('expanded');
  if(ex) state.open.add(id); else state.open.delete(id);
  document.querySelectorAll(`.nav-q[data-id="${id}"]`).forEach(n=>n.classList.toggle('active',ex));
}
function gotoQuestion(id){
  state.query=''; state.filter='all';
  $('#searchInput').value=''; $('#clearSearch').classList.remove('show');
  document.querySelectorAll('.filter-tab').forEach(t=>t.classList.toggle('active',t.dataset.filter==='all'));
  const x=DATA.questions.find(q=>q.id===id);
  if(x){
    // 展开对应分类
    state.activeCat=x.cat;
  }
  state.open.add(id);
  renderNav(); renderContent();
  requestAnimationFrame(()=>{
    const card=document.querySelector(`.q-card[data-id="${id}"]`);
    if(card){ card.scrollIntoView({behavior:'smooth',block:'center'}); card.classList.add('hl'); setTimeout(()=>card.classList.remove('hl'),1600); }
    const nav=document.querySelector(`.nav-q[data-id="${id}"]`);
    if(nav) nav.classList.add('active');
  });
}

function updateProgress(){
  const total=DATA.questions.length;
  const mastered=Object.values(state.mastery).filter(v=>v==='mastered').length;
  const fuzzy=Object.values(state.mastery).filter(v=>v==='fuzzy').length;
  const todo=total-mastered-fuzzy;
  const pct=Math.round(mastered/total*100);
  $('#progressPct').textContent=pct+'%';
  $('#progressFill').style.width=pct+'%';
  $('#statMastered').textContent=mastered+' 掌握';
  $('#statFuzzy').textContent=fuzzy+' 模糊';
  $('#statTodo').textContent=todo+' 未学';
}

/* ---------- 交互绑定 ---------- */
function bindEvents(){
  // 搜索
  let timer=null;
  $('#searchInput').addEventListener('input',e=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{
      state.query=e.target.value.trim();
      $('#clearSearch').style.display=state.query?'block':'none';
      renderNav(); renderContent();
    },180);
  });
  $('#clearSearch').onclick=()=>{ $('#searchInput').value=''; state.query=''; $('#clearSearch').style.display='none'; renderNav(); renderContent(); $('#searchInput').focus(); };
  document.addEventListener('keydown',e=>{
    if(e.key==='/' && document.activeElement.tagName!=='INPUT'){ e.preventDefault(); $('#searchInput').focus(); }
    if(e.key==='Escape'){
      if($('#randomModal').classList.contains('show')) closeRandom();
      else if(document.activeElement===$('#searchInput')){ $('#searchInput').value=''; state.query=''; $('#clearSearch').style.display='none'; renderNav(); renderContent(); $('#searchInput').blur(); }
    }
  });
  // 筛选
  $('#filterTabs').addEventListener('click',e=>{
    const b=e.target.closest('.filter-tab'); if(!b) return;
    state.filter=b.dataset.filter;
    document.querySelectorAll('.filter-tab').forEach(t=>t.classList.toggle('active',t===b));
    renderNav(); renderContent();
  });
  // 展开收起
  $('#expandAllBtn').onclick=()=>{ document.querySelectorAll('.nav-cat').forEach(c=>c.classList.add('open')); };
  $('#collapseAllBtn').onclick=()=>{ document.querySelectorAll('.nav-cat').forEach(c=>c.classList.remove('open')); };
  // 主题
  $('#themeBtn').onclick=()=>{
    const dark=document.documentElement.dataset.theme==='dark';
    if(dark){ delete document.documentElement.dataset.theme; localStorage.removeItem(THEME_KEY); }
    else { document.documentElement.dataset.theme='dark'; localStorage.setItem(THEME_KEY,'dark'); }
  };
  // 侧栏
  $('#menuToggle').onclick=openSidebar;
  $('#sidebarOverlay').onclick=closeSidebar;
  $('#brandLink').onclick=e=>{ e.preventDefault(); state.query='';state.filter='all';$('#searchInput').value='';document.querySelectorAll('.filter-tab').forEach(t=>t.classList.toggle('active',t.dataset.filter==='all'));renderNav();renderContent();window.scrollTo({top:0,behavior:'smooth'});closeSidebar(); };
  // 随机抽题
  $('#randomBtn').onclick=openRandom;
  $('#closeRandom').onclick=closeRandom;
  $('#randomModal').onclick=e=>{ if(e.target===$('#randomModal')) closeRandom(); };
  $('#randomAgain').onclick=pickRandom;
  $('#randomShow').onclick=()=>{ $('#randomAnswer').classList.add('show'); $('#randomAnswer').innerHTML='<div class="md">'+mdRender(DATA.answers[$('#randomShow').dataset.id]||'')+'</div>'; };
}
function openSidebar(){ $('#sidebar').classList.add('open'); $('#sidebarOverlay').classList.add('show'); }
function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#sidebarOverlay').classList.remove('show'); }

let curRandom=null;
function openRandom(){ $('#randomModal').classList.add('show'); pickRandom(); }
function closeRandom(){ $('#randomModal').classList.remove('show'); }
function pickRandom(){
  const pool=filteredQuestions().length?filteredQuestions():DATA.questions;
  const x=pool[Math.floor(Math.random()*pool.length)];
  curRandom=x;
  $('#randomQ').textContent=x.title;
  $('#randomAnswer').classList.remove('show');
  $('#randomAnswer').innerHTML='';
  $('#randomShow').dataset.id=x.id;
}

/* ---------- 启动 ---------- */
async function init(){
  loadState();
  try{
    const resp=await fetch(DATA_URL);
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    DATA=await resp.json();
  }catch(e){
    $('#contentInner').innerHTML='<div class="empty"><div class="empty-icon">⚠️</div><h3>数据加载失败</h3><p>请通过本地服务器打开本页（例如运行 <code>python -m http.server</code>），而不要直接双击 HTML 文件。<br>'+esc(e.message)+'</p></div>';
    return;
  }
  bindEvents();
  renderNav(); renderContent(); updateProgress();
}
init();
