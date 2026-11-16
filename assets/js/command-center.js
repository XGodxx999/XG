(()=> {
'use strict';
const $=s=>document.querySelector(s);
const pageNames={home:'首页 总览',goals:'目标',learn:'英语学习',money:'财务管理',career:'职业发展',workspace:'任务 习惯',tools:'工具中心',me:'个人中心'};
const toolNames={calc:'计算器 单位换算',focus:'专注计时',language:'翻译 词汇',browser:'浏览器 搜索',notes:'笔记 备忘',calendar:'日历 日程',data:'数据 备份',productivity:'效率 倒计时 密码',developer:'开发者 JSON Base64 UUID',network:'网络诊断',ai:'AI 助手',exchange:'汇率',creative:'图片 创作'};
let overlay,input,list,items=[],active=-1,lastFocus=null;
function build(){
 const header=$('.topbar');if(!header||$('#xgCommandOpen'))return;
 const actions=header.lastElementChild; // last child = actions row (language + profile); the old div:last-child query matched the brand-text div and put the button over the logo
 const open=document.createElement('button');open.id='xgCommandOpen';open.type='button';open.className='iconbtn';open.textContent='⌕';open.setAttribute('aria-label','搜索页面和工具');open.title='搜索页面和工具（⌘K / Ctrl K）';actions.insertBefore(open,actions.firstChild);
 overlay=document.createElement('div');overlay.id='xgCommandOverlay';overlay.hidden=true;
 overlay.style.cssText='position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.66);backdrop-filter:blur(12px);padding: min(14vh,110px) 16px 20px;display:flex;justify-content:center;align-items:flex-start';
 const panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','全局命令中心');panel.style.cssText='width:min(620px,100%);max-height:75vh;overflow:hidden;border:1px solid rgba(220,232,248,.22);border-radius:22px;background:#111722;box-shadow:0 30px 100px #000a;color:#f4f7fb;display:flex;flex-direction:column';
 const top=document.createElement('div');top.style.cssText='padding:16px;border-bottom:1px solid #303b4a';
 input=document.createElement('input');input.type='search';input.placeholder='搜索页面、工具或功能…';input.setAttribute('aria-label','搜索页面和工具');input.style.cssText='width:100%;padding:14px 15px;border-radius:13px;border:1px solid #3c4859;background:#080d15;color:#fff;font:inherit;outline:none';top.append(input);
 const hint=document.createElement('div');hint.textContent='输入关键词快速跳转 · ↑↓ 选择 · Enter 打开 · Esc 关闭';hint.style.cssText='font-size:11px;color:#98a6b8;margin-top:10px';top.append(hint);
 list=document.createElement('div');list.style.cssText='overflow:auto;padding:8px;overscroll-behavior:contain';list.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();input.focus()}else if(e.key==='ArrowDown'){e.preventDefault();move(1);list.querySelectorAll('button')[active]?.focus()}else if(e.key==='ArrowUp'){e.preventDefault();move(-1);list.querySelectorAll('button')[active]?.focus()}else if(e.key==='Escape'){hide()}});panel.append(top,list);overlay.append(panel);overlay.style.display='none';document.body.append(overlay);
 open.addEventListener('click',show);overlay.addEventListener('click',e=>{if(e.target===overlay)hide()});
 input.addEventListener('input',render);input.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const buttons=list.querySelectorAll('button');if(buttons.length)buttons[active>=0?active:0].focus();}else if(e.key==='ArrowDown'){e.preventDefault();move(1)}else if(e.key==='ArrowUp'){e.preventDefault();move(-1)}else if(e.key==='Enter'){e.preventDefault();choose()}else if(e.key==='Escape'){hide()}});
}
function collect(){
 const found=[];
 document.querySelectorAll('.page[id]').forEach(el=>{const id=el.id;if(pageNames[id])found.push({kind:'page',id,label:pageNames[id],detail:'页面',keywords:pageNames[id]+' '+id})});
 document.querySelectorAll('.tool-section[data-tool-section]').forEach(el=>{const id=el.dataset.toolSection;found.push({kind:'tool',id,label:toolNames[id]||el.querySelector('h2,h3')?.textContent?.trim()||id,detail:'工具',keywords:(toolNames[id]||'')+' '+id+' '+(el.innerText||'').slice(0,160)})});
 return found;
}
function show(){if(!overlay)build();lastFocus=document.activeElement;items=collect();overlay.hidden=false;overlay.style.display='flex';input.value='';render();requestAnimationFrame(()=>input.focus())}
function hide(){if(overlay){overlay.hidden=true;overlay.style.display='none';if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();lastFocus=null}}
function render(){
 const q=input.value.trim().toLocaleLowerCase();const matches=items.filter(x=>!q||(x.label+' '+x.keywords+' '+x.detail).toLocaleLowerCase().includes(q)).slice(0,30);active=matches.length?0:-1;list.replaceChildren();
 if(!matches.length){const empty=document.createElement('p');empty.textContent='没有找到匹配的页面或工具';empty.style.cssText='padding:18px;color:#aab7c8;text-align:center';list.append(empty);return}
 matches.forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','option');b.setAttribute('aria-selected',String(i===active));b.style.cssText='display:flex;align-items:center;justify-content:space-between;width:100%;text-align:left;padding:13px 14px;border:0;border-radius:12px;background:'+(i===active?'#263448':'transparent')+';color:#f4f7fb;cursor:pointer;font:inherit';const left=document.createElement('span');left.textContent=item.label;const right=document.createElement('small');right.textContent=item.detail;right.style.color='#9eacbf';b.append(left,right);b.addEventListener('mouseenter',()=>{active=i;highlight()});b.addEventListener('click',()=>openItem(item));list.append(b)});
}
function highlight(){[...list.querySelectorAll('button')].forEach((b,i)=>{b.style.background=i===active?'#263448':'transparent';b.setAttribute('aria-selected',String(i===active));})}
function move(d){const n=list.querySelectorAll('button').length;if(!n)return;active=(active+d+n)%n;highlight();list.querySelectorAll('button')[active]?.scrollIntoView({block:'nearest'})}
function choose(){const b=list.querySelectorAll('button')[active];if(b)b.click()}
function openItem(item){
 hide();
 if(item.kind==='page'){if(typeof window.go==='function')window.go(item.id);else document.querySelector('[data-tab="'+item.id+'"]')?.click();if(item.id==='tools'&&typeof window.closeToolWorkspace==='function')window.closeToolWorkspace();}
 else if(typeof window.openToolWorkspace==='function')window.openToolWorkspace(item.id);
}
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();show()}else if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();show()}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
