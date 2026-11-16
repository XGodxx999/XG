
const $=id=>document.getElementById(id),STORE='xg-prime-data-v3',LEGACY_STORE='xg-prime-data-v2';
let data={goals:[],tx:[],career:[],investments:[],careerJobs:[],learned:[],seeded:false};
function loadData(){try{const raw=localStorage.getItem(STORE)||localStorage.getItem(LEGACY_STORE)||localStorage.getItem('xg-prime-data');const old=raw?JSON.parse(raw):{};return{goals:Array.isArray(old.goals)?old.goals:[],tx:Array.isArray(old.tx)?old.tx:[],career:Array.isArray(old.career)?old.career:[],investments:Array.isArray(old.investments)?old.investments:[],careerJobs:Array.isArray(old.careerJobs)?old.careerJobs:[],learned:Array.isArray(old.learned)?old.learned:[],seeded:!!old.seeded}}catch(e){console.warn('Local data could not be read',e);return{goals:[],tx:[],career:[]}}}
data=loadData();if(!data.seeded&&data.goals.length===0){data.goals=[{text:'学习英语 15 分钟',done:true},{text:'运动',done:true},{text:'存钱',done:false}];data.seeded=true;try{localStorage.setItem(STORE,JSON.stringify(data))}catch(e){}}
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(data));render()}catch(e){alert('本机存储空间不足，请先导出备份')}};
const money=n=>'¥'+Number(n||0).toFixed(2);
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 $('goalList').innerHTML=data.goals.map((g,i)=>'<div class="listrow"><input type="checkbox" data-goal="'+i+'" '+(g.done?'checked':'')+'><span class="'+(g.done?'done':'')+'">'+safe(g.text)+'</span><button class="btn secondary" data-del="'+i+'">删除</button></div>').join('')||'<p class="muted">还没有目标，添加第一项吧。</p>';
 let inc=0,exp=0;data.tx.forEach(t=>{if(t.type==='income')inc+=Number(t.amount);else exp+=Number(t.amount)});
 $('income').textContent=money(inc);$('expense').textContent=money(exp);$('incomePage').textContent=money(inc);$('expensePage').textContent=money(exp);
 const done=data.goals.filter(g=>g.done).length,pct=data.goals.length?Math.round(done/data.goals.length*100):0;
 $('goalCount').textContent=done+' / '+data.goals.length+' 已完成';$('progressText').textContent=pct+'%';$('progressFill').style.width=pct+'%';
 $('txList').innerHTML=data.tx.map((t,i)=>'<div class="listrow"><span>'+safe(t.memo||'收支记录')+'<small class="muted" style="display:block">'+safe(t.date)+'</small></span><strong>'+ (t.type==='income'?'+':'−')+money(t.amount)+'</strong><button class="btn secondary" data-txdel="'+i+'">删除</button></div>').join('')||'<p class="muted">暂无记录。</p>';
 $('goalPreview').innerHTML=data.goals.slice(0,3).map(g=>'<div style="display:flex;gap:8px;align-items:center;padding:6px 0;font-size:13px"><span>'+(g.done?'✓':'○')+'</span><span class="'+(g.done?'done':'')+'">'+safe(g.text)+'</span></div>').join('')||'<p class="muted">还没有目标，添加第一项吧。</p>';
 let invTotal=0;data.investments.forEach(v=>invTotal+=Number(v.amount));
 $('investTotal').textContent=money(invTotal);
 $('investList').innerHTML=data.investments.map((v,i)=>'<div class="listrow"><span>'+safe(v.name)+'<small class="muted" style="display:block">'+(Number(v.change)>=0?'+':'')+Number(v.change||0).toFixed(2)+'%</small></span><strong>'+money(v.amount)+'</strong><button class="btn secondary" data-invdel="'+i+'">删除</button></div>').join('')||'<p class="muted">暂无投资记录。</p>';
 const jobTasks=['更新简历与工作经历','整理培训证明与证书','搜索目标岗位并记录','了解移民 / 签证官方要求','准备面试英语自我介绍'];
 $('careerJobsList').innerHTML=jobTasks.map((x,i)=>'<div class="listrow"><input type="checkbox" data-careerjob="'+i+'" '+(data.careerJobs[i]?'checked':'')+'><span class="'+(data.careerJobs[i]?'done':'')+'">'+x+'</span></div>').join('');
 const tasks=['了解制冷循环与基础原理','学习 HVAC 常见工具与安全规范','学习铜管加工、焊接与保温','学习电气基础与控制线路','练习设备安装、维护与故障排查','整理培训证明与工作经历'];
 $('careerList').innerHTML=tasks.map((x,i)=>'<div class="listrow"><input type="checkbox" data-career="'+i+'" '+(data.career[i]?'checked':'')+'><span class="'+(data.career[i]?'done':'')+'">'+x+'</span></div>').join('');
}
function go(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>go(b.dataset.tab));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));

function openToolWorkspace(key){const catalog=$('toolCatalog'),detail=$('toolDetail');if(!catalog||!detail)return;catalog.hidden=true;detail.hidden=false;document.querySelectorAll('.tool-section').forEach(x=>x.classList.toggle('tool-active',x.dataset.toolSection===key));const meta={calc:['计算与换算','科学计算器与多类别单位换算'],focus:['专注计时','番茄专注与休息计时器'],language:['语言工具','离线英汉词汇查询'],browser:['浏览与搜索','网址直达与网页搜索'],notes:['快速备忘','本地记录、搜索与置顶'],calendar:['日历中心','月历视图与日程管理'],data:['数据中心','完整备份、恢复与隐私管理'],productivity:['效率工具箱','秒表、倒计时、文本处理与密码生成'],developer:['开发者工具','JSON、Base64、文本差异比较与 UUID'],network:['网络诊断','连接状态、当前网站延迟与公网 IP 查询'],ai:['AI 工作台','连接兼容模型服务，进行智能对话与提示词管理'],exchange:['汇率换算','在线参考汇率换算'],creative:['图片与创作','本地图片压缩、颜色转换与 Markdown 预览']};$('toolDetailTitle').textContent=(meta[key]||['工具','完整操作界面'])[0];$('toolDetailDesc').textContent=(meta[key]||['',''])[1];go('tools');if(key==='calendar')drawCalendar();}
function closeToolWorkspace(){if($('toolDetail'))$('toolDetail').hidden=true;if($('toolCatalog'))$('toolCatalog').hidden=false;document.querySelectorAll('.tool-section').forEach(x=>x.classList.remove('tool-active'))}
$('toolBack').onclick=closeToolWorkspace;$('toolExport').onclick=()=>$('export').click();$('toolImport').onclick=()=>$('importBtn').click();
document.querySelectorAll('[data-open-tool]').forEach(b=>b.addEventListener('click',()=>openToolWorkspace(b.dataset.openTool)));
function openCenter(id){if(id==='me-data'){go('me');openMeView('data');return}if(id==='calendar'||id==='data'){openToolWorkspace(id);return}go(id)}
document.querySelectorAll('[data-center]').forEach(b=>b.addEventListener('click',()=>openCenter(b.dataset.center)));
document.querySelectorAll('[data-home-tool]').forEach(b=>b.addEventListener('click',()=>{const map={finance:'money',calendar:'calendar',learning:'learn',data:'data'};openCenter(map[b.dataset.homeTool]||'tools')}));
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.tool==='calculator'?'calc':b.dataset.tool==='translate'?'language':b.dataset.tool;openToolWorkspace(key)}));
function openMeView(view){$('meMenu').hidden=true;$('meFeedbackView').hidden=view!=='feedback';$('meDataView').hidden=view!=='data';$('meSettingsView').hidden=view!=='settings'}
document.querySelectorAll('[data-me-view]').forEach(b=>b.addEventListener('click',()=>openMeView(b.dataset.meView)));
document.querySelectorAll('[data-me-back]').forEach(b=>b.addEventListener('click',()=>{ $('meMenu').hidden=false;$('meFeedbackView').hidden=true;$('meDataView').hidden=true;$('meSettingsView').hidden=true; }));
$('settingsLanguage').value=localStorage.getItem('xg-prime-language')||'zh-CN';
$('settingsLanguage').onchange=e=>{localStorage.setItem('xg-prime-language',e.target.value);const top=$('languageSelect');if(top)top.value=e.target.value};

$('profileShortcut').onclick=()=>go('me');
$('date').textContent=new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
$('addGoal').onclick=()=>{const v=$('goalInput').value.trim();if(v){data.goals.push({text:v,done:false});$('goalInput').value='';save()}};
$('goalInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('addGoal').click()});
$('goalList').onchange=e=>{if(e.target.dataset.goal!==undefined){data.goals[+e.target.dataset.goal].done=e.target.checked;save()}};
$('goalList').onclick=e=>{if(e.target.dataset.del!==undefined){data.goals.splice(+e.target.dataset.del,1);save()}};
$('addTx').onclick=()=>{const n=Number($('amount').value);if(n>0&&Number.isFinite(n)){data.tx.push({type:$('type').value,amount:n,memo:$('memo').value.trim(),date:new Date().toLocaleDateString('zh-CN')});$('amount').value='';$('memo').value='';save()}};
$('txList').onclick=e=>{if(e.target.dataset.txdel!==undefined){data.tx.splice(+e.target.dataset.txdel,1);save()}};
$('careerList').onchange=e=>{if(e.target.dataset.career!==undefined){data.career[+e.target.dataset.career]=e.target.checked;save()}};
const words=[['work','工作'],['learn','学习'],['save','储蓄；节省'],['skill','技能'],['job','工作；职位'],['time','时间'],['today','今天'],['future','未来'],['money','钱'],['goal','目标'],['plan','计划'],['grow','成长'],['study','学习；研究'],['read','阅读'],['exercise','运动；锻炼'],['invest','投资'],['market','市场'],['career','职业；事业'],['english','英语'],['health','健康'],['dream','梦想'],['home','家；首页'],['tool','工具'],['finance','财务；金融'],['morning','早上'],['night','晚上'],['hello','你好'],['thank','谢谢'],['good','好的'],['prime','首要的；优质的']];
let wi=0;$('word').textContent=words[0][0];$('wordNum').textContent='WORD 01 / '+words.length;
$('reveal').onclick=()=>$('meaning').textContent=words[wi][1];
const showWord=()=>{$('word').textContent=words[wi][0];$('wordNum').textContent='WORD '+String(wi+1).padStart(2,'0')+' / '+words.length;$('meaning').textContent='点击显示中文释义';$('learnedCount').textContent='已掌握 '+(data.learned||[]).length+' / '+words.length+' 个词';};
$('next').onclick=()=>{wi=(wi+1)%words.length;showWord()};
$('prev').onclick=()=>{wi=(wi-1+words.length)%words.length;showWord()};
$('markLearned').onclick=()=>{const w=words[wi][0];if(!data.learned.includes(w))data.learned.push(w);save();showWord()};
showWord();
const TRANSLATE_DICT={work:'工作',learn:'学习',save:'储蓄；节省',skill:'技能',job:'工作；职位',time:'时间',today:'今天',future:'未来',money:'钱',goal:'目标',plan:'计划',grow:'成长',health:'健康',study:'学习；研究',read:'阅读',exercise:'运动；锻炼',invest:'投资',market:'市场',career:'职业；事业',english:'英语',hello:'你好',thank:'谢谢',good:'好的；好的',morning:'早上',night:'晚上',home:'家；首页',tool:'工具',finance:'财务；金融',dream:'梦想',bigger:'更大的',prime:'首要的；优质的'};
$('translateBtn').onclick=()=>{const q=$('translateInput').value.trim().toLowerCase();if(!q)return;$('translateResult').textContent=TRANSLATE_DICT[q]||('未收录 “'+q+'”，试试 work / learn / future 等常用词');};
$('translateInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('translateBtn').click()});
$('browserOpen').onclick=()=>{const q=$('browserInput').value.trim();if(!q)return;const url=/^https?:\/\//i.test(q)||q.includes('.')&&!q.includes(' ')?(q.startsWith('http')?q:'https://'+q):'https://www.bing.com/search?q='+encodeURIComponent(q);window.open(url,'_blank')};
/* Personal workbench: isolated local storage, independent from existing app records. */
const WORK_STORE='xg-prime-workbench-v1';let workData={tasks:[],habits:[]},workFilter='all';
const workToday=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
try{const saved=JSON.parse(localStorage.getItem(WORK_STORE)||'{}');if(saved&&typeof saved==='object'){workData.tasks=Array.isArray(saved.tasks)?saved.tasks.filter(x=>x&&typeof x.title==='string').slice(0,1000):[];workData.habits=Array.isArray(saved.habits)?saved.habits.filter(x=>x&&typeof x.name==='string'&&Array.isArray(x.logs)).slice(0,100):[]}}catch(e){console.warn('Workbench data unavailable',e)}
function saveWork(){try{localStorage.setItem(WORK_STORE,JSON.stringify(workData));drawWorkbench()}catch(e){alert('工作台保存失败：本机存储空间可能不足')}}
function habitStreak(logs){const set=new Set(logs);let day=new Date();if(!set.has(workToday()))day.setDate(day.getDate()-1);let count=0;for(let i=0;i<366;i++){const key=day.getFullYear()+'-'+String(day.getMonth()+1).padStart(2,'0')+'-'+String(day.getDate()).padStart(2,'0');if(!set.has(key))break;count++;day.setDate(day.getDate()-1)}return count}
function drawWorkbench(){const today=workToday(),doneToday=workData.tasks.filter(t=>t.done&&t.doneDate===today).length,open=workData.tasks.filter(t=>!t.done).length,habitDone=workData.habits.filter(h=>h.logs.includes(today)).length;$('workOpen').textContent=open;$('workDone').textContent=doneToday;$('workHabitDone').textContent=habitDone;
const tasks=workData.tasks.map((t,i)=>({...t,i})).filter(t=>workFilter==='all'||(workFilter==='open'?!t.done:t.done)).sort((a,b)=>Number(a.done)-Number(b.done)||(a.due||'9999').localeCompare(b.due||'9999')||(a.priority==='high'?-1:0));
$('workTaskList').innerHTML=tasks.map(t=>'<div class="workItem"><input type="checkbox" data-worktask="'+t.i+'" '+(t.done?'checked':'')+' aria-label="Complete task"><span class="workText '+(t.done?'workDone':'')+'">'+safe(t.title)+'<small class="workMeta">'+(t.priority==='high'?'高优先级':t.priority==='low'?'低优先级':'普通')+(t.due?' · 截止 '+safe(t.due):'')+'</small></span><span class="workActions"><button class="btn secondary" data-workdel="'+t.i+'">删除</button></span></div>').join('')||'<p class="muted">这里还没有任务。添加第一项吧。</p>';
$('workHabitList').innerHTML=workData.habits.map((h,i)=>{const checked=h.logs.includes(today);return '<div class="workItem"><span class="workText"><strong>'+safe(h.name)+'</strong><small class="workMeta">连续 '+habitStreak(h.logs)+' 天 · 累计 '+h.logs.length+' 次</small></span><span class="workActions"><button class="btn '+(checked?'secondary':'')+'" data-workhabit="'+i+'">'+(checked?'已打卡':'今日打卡')+'</button><button class="btn danger" data-workhabitdel="'+i+'">删除</button></span></div>'}).join('')||'<p class="muted">添加一个想长期坚持的习惯。</p>';
document.querySelectorAll('[data-workfilter]').forEach(b=>b.classList.toggle('active',b.dataset.workfilter===workFilter))}
$('workTaskAdd').onclick=()=>{const title=$('workTaskInput').value.trim();if(!title)return;if(workData.tasks.length>=1000){alert('任务数量已达上限');return}workData.tasks.push({title,due:$('workTaskDate').value,priority:$('workTaskPriority').value,done:false,created:Date.now()});$('workTaskInput').value='';saveWork()};
$('workTaskInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('workTaskAdd').click()});
$('workTaskList').onchange=e=>{const i=e.target.dataset.worktask;if(i!==undefined){const t=workData.tasks[+i];t.done=e.target.checked;t.doneDate=t.done?workToday():'';saveWork()}};
$('workTaskList').onclick=e=>{const i=e.target.dataset.workdel;if(i!==undefined){workData.tasks.splice(+i,1);saveWork()}};
document.querySelectorAll('[data-workfilter]').forEach(b=>b.onclick=()=>{workFilter=b.dataset.workfilter;drawWorkbench()});
$('workHabitAdd').onclick=()=>{const name=$('workHabitInput').value.trim();if(!name)return;if(workData.habits.length>=100){alert('习惯数量已达上限');return}if(workData.habits.some(h=>h.name.toLowerCase()===name.toLowerCase())){alert('这个习惯已经存在');return}workData.habits.push({name,logs:[]});$('workHabitInput').value='';saveWork()};
$('workHabitInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('workHabitAdd').click()});
$('workHabitList').onclick=e=>{const check=e.target.dataset.workhabit,del=e.target.dataset.workhabitdel;if(check!==undefined){const h=workData.habits[+check],today=workToday();h.logs=h.logs.includes(today)?h.logs.filter(x=>x!==today):[...h.logs,today];saveWork()}else if(del!==undefined){workData.habits.splice(+del,1);saveWork()}};
drawWorkbench();
/* Local notes module: isolated storage keeps existing user records untouched. */
const NOTE_STORE='xg-prime-notes-v1';
let notes=[];
try{const savedNotes=JSON.parse(localStorage.getItem(NOTE_STORE)||'[]');if(Array.isArray(savedNotes))notes=savedNotes.filter(n=>n&&typeof n.text==='string').slice(0,500)}catch(e){console.warn('Notes could not be loaded',e)}
const saveNotes=()=>{try{localStorage.setItem(NOTE_STORE,JSON.stringify(notes));drawNotes()}catch(e){alert('备忘保存失败：本机存储空间可能不足')}};
function drawNotes(){
 const q=($('noteSearch').value||'').trim().toLowerCase();
 const shown=notes.map((n,i)=>({...n,i})).filter(n=>!q||n.text.toLowerCase().includes(q)).sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||b.updated-a.updated);
 $('noteCount').textContent=notes.length+' 条备忘 · '+shown.length+' 条显示';
 $('noteList').innerHTML=shown.map(n=>'<div class="listrow" style="align-items:flex-start"><span style="white-space:pre-wrap;overflow-wrap:anywhere">'+(n.pinned?'★ ':'')+safe(n.text)+'</span><button class="btn secondary" data-notepin="'+n.i+'" aria-label="Pin note">'+(n.pinned?'取消置顶':'置顶')+'</button><button class="btn danger" data-notedel="'+n.i+'" aria-label="Delete note">删除</button></div>').join('')||'<p class="note">暂无备忘</p>';
}
$('noteAdd').onclick=()=>{const textValue=$('noteInput').value.trim();if(!textValue)return;if(textValue.length>5000){alert('单条备忘最多 5000 个字符');return}notes.push({text:textValue,pinned:false,created:Date.now(),updated:Date.now()});$('noteInput').value='';saveNotes()};
$('noteSearch').oninput=drawNotes;
$('noteInput').addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')$('noteAdd').click()});
$('noteList').onclick=e=>{const pin=e.target.dataset.notepin,del=e.target.dataset.notedel;if(pin!==undefined){notes[+pin].pinned=!notes[+pin].pinned;notes[+pin].updated=Date.now();saveNotes()}else if(del!==undefined){notes.splice(+del,1);saveNotes()}};
drawNotes();
/* Additional local-first tools. No account or server storage is required. */
let swRunning=false,swStarted=0,swElapsed=0,swFrame=null,countdownEnd=0,countdownFrame=null,countdownRemaining=0;
const fmtStopwatch=ms=>{const t=Math.max(0,ms),m=Math.floor(t/60000),sec=Math.floor(t/1000)%60,cs=Math.floor(t%1000/10);return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')+'.'+String(cs).padStart(2,'0')};
function drawStopwatch(){const v=swElapsed+(swRunning?Date.now()-swStarted:0);$('stopwatchDisplay').textContent=fmtStopwatch(v);if(swRunning)swFrame=requestAnimationFrame(drawStopwatch)}
$('stopwatchToggle').onclick=()=>{if(swRunning){swElapsed+=Date.now()-swStarted;swRunning=false;cancelAnimationFrame(swFrame);$('stopwatchToggle').textContent='继续秒表';drawStopwatch()}else{swStarted=Date.now();swRunning=true;$('stopwatchToggle').textContent='暂停秒表';drawStopwatch()}};
$('stopwatchReset').onclick=()=>{swRunning=false;swElapsed=0;cancelAnimationFrame(swFrame);$('stopwatchToggle').textContent='开始秒表';drawStopwatch()};
function drawCountdown(){const left=Math.max(0,countdownEnd-Date.now());$('countdownDisplay').textContent=String(Math.floor(left/60000)).padStart(2,'0')+':'+String(Math.floor(left/1000)%60).padStart(2,'0');if(left<=0){clearInterval(countdownFrame);countdownFrame=null;$('timerStatus').textContent='倒计时结束';if('vibrate'in navigator)navigator.vibrate([180,80,180]);return}countdownFrame=requestAnimationFrame(drawCountdown)}
$('countdownStart').onclick=()=>{if(countdownFrame){cancelAnimationFrame(countdownFrame);countdownFrame=null}const mins=Math.max(1,Math.min(1440,Number($('countdownMinutes').value)||5));countdownEnd=Date.now()+mins*60000;$('timerStatus').textContent='倒计时进行中';drawCountdown()};
$('countdownReset').onclick=()=>{cancelAnimationFrame(countdownFrame);countdownFrame=null;const m=Math.max(1,Math.min(1440,Number($('countdownMinutes').value)||5));$('countdownDisplay').textContent=String(m).padStart(2,'0')+':00';$('timerStatus').textContent='倒计时已重置'};
function updateTextStats(){const v=$('textUtilityInput').value;$('textUtilityStats').textContent=v.length+' 字符 · '+(v.trim()?v.trim().split(/\s+/).length:0)+' 词 · '+(v?v.split(/\r?\n/).length:0)+' 行'}
$('textUtilityInput').oninput=updateTextStats;
document.querySelectorAll('[data-text-action]').forEach(b=>b.onclick=async()=>{let v=$('textUtilityInput').value;const a=b.dataset.textAction;if(a==='upper')v=v.toLocaleUpperCase();if(a==='lower')v=v.toLocaleLowerCase();if(a==='trim')v=v.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).join('\n');$('textUtilityInput').value=v;updateTextStats();if(a==='copy'){try{await navigator.clipboard.writeText(v);$('textUtilityStatus').textContent='已复制'}catch(e){$('textUtilityStatus').textContent='复制失败，请手动复制'}}else $('textUtilityStatus').textContent='处理完成'});
$('passwordGenerate').onclick=()=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-_=+';const n=Math.max(8,Math.min(64,Number($('passwordLength').value)||16));const bytes=new Uint8Array(n);crypto.getRandomValues(bytes);$('passwordOutput').value=Array.from(bytes,x=>chars[x%chars.length]).join('')};
$('passwordCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('passwordOutput').value);$('passwordCopy').textContent='已复制'}catch(e){$('passwordCopy').textContent='复制失败'}};
function jsonRun(minify){try{const obj=JSON.parse($('jsonInput').value);$('jsonOutput').value=JSON.stringify(obj,null,minify?0:2);$('jsonStatus').textContent='JSON 有效'}catch(e){$('jsonStatus').textContent='JSON 错误：'+e.message;$('jsonOutput').value=''}}
$('jsonFormat').onclick=()=>jsonRun(false);$('jsonMinify').onclick=()=>jsonRun(true);
$('jsonCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('jsonOutput').value);$('jsonStatus').textContent='结果已复制'}catch(e){$('jsonStatus').textContent='复制失败'}};
function codec(fn){try{$('codecOutput').value=fn($('codecInput').value);$('codecStatus').textContent='处理完成'}catch(e){$('codecStatus').textContent='处理失败：'+e.message}}
$('base64Encode').onclick=()=>codec(v=>btoa(Array.from(new TextEncoder().encode(v),b=>String.fromCharCode(b)).join('')));
$('base64Decode').onclick=()=>codec(v=>new TextDecoder().decode(Uint8Array.from(atob(v),c=>c.charCodeAt(0))));
$('urlEncode').onclick=()=>codec(encodeURIComponent);$('urlDecode').onclick=()=>codec(decodeURIComponent);
$('codecCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('codecOutput').value);$('codecStatus').textContent='结果已复制'}catch(e){$('codecStatus').textContent='复制失败'}};
$('uuidGenerate').onclick=()=>{$('uuidOutput').value=crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})};
$('uuidCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('uuidOutput').value)}catch(e){}};
$('exchangeRun').onclick=async()=>{const from=$('exchangeFrom').value,to=$('exchangeTo').value,amount=Number($('exchangeAmount').value);if(!(amount>=0)){$('exchangeResult').textContent='请输入有效金额';return}if(from===to){$('exchangeResult').textContent=amount.toFixed(2)+' '+to;$('exchangeUpdated').textContent='同币种，无需换算';return}$('exchangeResult').textContent='正在获取汇率…';try{const res=await fetch('https://api.frankfurter.app/latest?from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to));if(!res.ok)throw new Error('汇率服务暂不可用');const d=await res.json(),rate=d.rates[to];if(!Number.isFinite(rate))throw new Error('未返回该币种汇率');$('exchangeResult').textContent=(amount*rate).toLocaleString(undefined,{maximumFractionDigits:4})+' '+to;$('exchangeUpdated').textContent='参考汇率：1 '+from+' = '+rate+' '+to+' · 日期：'+d.date}catch(e){$('exchangeResult').textContent='查询失败：'+e.message;$('exchangeUpdated').textContent='请检查网络后重试'}};

/* Calculator, unit conversion and focus timer: wired to their visible controls. */
(()=>{
 const $=id=>document.getElementById(id);
 const expr=$('calcExpression'),result=$('calcResult');
 function evaluateExpression(source){
  const tokens=source.replace(/[×]/g,'*').replace(/[÷]/g,'/').replace(/[−]/g,'-').replace(/\bpi\b/gi,'pi').match(/(?:\d+(?:\.\d*)?|\.\d+|pi|sqrt|sin|cos|tan|log|abs|[()+\-*/^])/gi);
  if(!tokens||tokens.join('')!==source.replace(/\s+/g,'').replace(/[×÷−]/g,c=>({'×':'*','÷':'/','−':'-'}[c])).replace(/\bPI\b/gi,'pi'))throw Error('表达式含有不支持的字符');
  let i=0;
  const peek=()=>tokens[i],take=()=>tokens[i++];
  function primary(){
   const t=take();if(t===undefined)throw Error('表达式不完整');
   if(t==='+')return primary();if(t==='-')return -primary();
   if(t==='('){const v=add();if(take()!==')')throw Error('括号不匹配');return v}
   if(t==='pi')return Math.PI;
   if(['sin','cos','tan','sqrt','log','abs'].includes(t.toLowerCase())){if(take()!=='(')throw Error('函数后需要括号');const v=add();if(take()!==')')throw Error('函数括号不匹配');const fn=t.toLowerCase();return fn==='sin'?Math.sin(v*Math.PI/180):fn==='cos'?Math.cos(v*Math.PI/180):fn==='tan'?Math.tan(v*Math.PI/180):fn==='sqrt'?Math.sqrt(v):fn==='log'?Math.log10(v):Math.abs(v)}
   if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t))throw Error('无法识别：'+t);return Number(t);
  }
  function power(){let v=primary();if(peek()==='^'){take();v=Math.pow(v,power())}return v}
  function mul(){let v=power();while(peek()==='*'||peek()==='/'){const op=take(),r=power();v=op==='*'?v*r:v/r}return v}
  function add(){let v=mul();while(peek()==='+'||peek()==='-'){const op=take(),r=mul();v=op==='+'?v+r:v-r}return v}
  const value=add();if(i!==tokens.length)throw Error('表达式格式不正确');if(!Number.isFinite(value))throw Error('结果不是有效数字');return value;
 }
 function calculate(){try{const v=evaluateExpression(expr.value);result.textContent=Number(v.toPrecision(12)).toLocaleString('zh-CN',{maximumFractionDigits:10})}catch(e){result.textContent=e.message}}
 if($('calculate'))$('calculate').onclick=calculate;
 if($('calcClear'))$('calcClear').onclick=()=>{expr.value='';result.textContent='结果显示在这里';expr.focus()};
 if(expr)expr.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();calculate()}});
 document.querySelectorAll('[data-calc-insert]').forEach(b=>b.onclick=()=>{const v=b.dataset.calcInsert==='pi'?'pi':b.dataset.calcInsert;const a=expr.selectionStart??expr.value.length,z=expr.selectionEnd??a;expr.value=expr.value.slice(0,a)+v+expr.value.slice(z);expr.focus();expr.setSelectionRange(a+v.length,a+v.length)});
 const units={
  length:{'米':1,'千米':1000,'厘米':.01,'毫米':.001,'英寸':.0254,'英尺':.3048,'英里':1609.344},
  weight:{'千克':1,'克':.001,'毫克':.000001,'吨':1000,'磅':.45359237,'盎司':.028349523125},
  area:{'平方米':1,'平方千米':1e6,'平方厘米':.0001,'公顷':10000,'英亩':4046.8564224,'平方英尺':.09290304},
  volume:{'升':1,'毫升':.001,'立方米':1000,'美制加仑':3.785411784,'杯（美制）':.2365882365},
  speed:{'米/秒':1,'千米/小时':1/3.6,'英里/小时':.44704,'节':.514444},
  time:{'秒':1,'分钟':60,'小时':3600,'天':86400,'周':604800},
  data:{'字节':1,'KB':1024,'MB':1048576,'GB':1073741824,'TB':1099511627776}
 };
 const category=$('unitCategory'),from=$('unitFrom'),to=$('unitTo');
 function fillUnits(){if(!category||!from||!to)return;const key=category.value;let names=key==='temperature'?['摄氏度','华氏度','开尔文']:Object.keys(units[key]||{});const oldFrom=from.value,oldTo=to.value;[from,to].forEach(sel=>{sel.innerHTML=names.map(n=>'<option>'+n+'</option>').join('')});from.value=names.includes(oldFrom)?oldFrom:names[0];to.value=names.includes(oldTo)&&oldTo!==from.value?oldTo:(names[1]||names[0])}
 function convertUnits(){const v=Number($('unitValue').value);if(!Number.isFinite(v)){$('unitResult').textContent='请输入有效数值';return}const a=from.value,b=to.value;let out;
  if(category.value==='temperature'){const c=a==='摄氏度'?v:a==='华氏度'?(v-32)*5/9:v-273.15;out=b==='摄氏度'?c:b==='华氏度'?c*9/5+32:c+273.15}
  else{const table=units[category.value];out=v*table[a]/table[b]}
  $('unitResult').textContent=Number(out.toPrecision(12)).toLocaleString('zh-CN',{maximumFractionDigits:10})+' '+b;
 }
 if(category){category.addEventListener('change',fillUnits);fillUnits()}
 if($('unitConvert'))$('unitConvert').onclick=convertUnits;
 if($('unitValue'))$('unitValue').addEventListener('keydown',e=>{if(e.key==='Enter')convertUnits()});
 let focusDuration=25*60,focusEnd=0,focusFrame=0,focusRunning=false,breakMode=false;
 function drawFocus(){const left=Math.max(0,focusEnd-Date.now()),m=Math.floor(left/60000),sec=Math.floor(left/1000)%60;$('focusDisplay').textContent=String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');if(left<=0){focusRunning=false;focusFrame=0;$('focusStart').textContent='开始';$('focusStatus').textContent=breakMode?'休息结束':'专注完成';return}focusFrame=requestAnimationFrame(drawFocus)}
 if($('focusStart'))$('focusStart').onclick=()=>{if(focusRunning){focusRunning=false;cancelAnimationFrame(focusFrame);focusFrame=0;$('focusStart').textContent='继续';$('focusStatus').textContent='已暂停';return}focusEnd=Date.now()+focusDuration*1000;focusRunning=true;$('focusStart').textContent='暂停';$('focusStatus').textContent=breakMode?'休息计时中':'专注计时中';drawFocus()};
 if($('focusReset'))$('focusReset').onclick=()=>{focusRunning=false;cancelAnimationFrame(focusFrame);focusFrame=0;$('focusDisplay').textContent=String(Math.floor(focusDuration/60)).padStart(2,'0')+':00';$('focusStart').textContent='开始';$('focusStatus').textContent='已重置'};
 if($('focusMode'))$('focusMode').onclick=()=>{focusRunning=false;cancelAnimationFrame(focusFrame);focusFrame=0;breakMode=!breakMode;focusDuration=breakMode?5*60:25*60;$('focusMode').textContent=breakMode?'切换专注 25 分钟':'切换休息 5 分钟';$('focusDisplay').textContent=breakMode?'05:00':'25:00';$('focusStart').textContent='开始';$('focusStatus').textContent=breakMode?'准备休息':'准备开始专注'};
})();

// Feedback is composed locally; GitHub submission requires the user's confirmation.
function buildFeedbackBody(){
 const type=$('feedbackType').value,title=$('feedbackTitle').value.trim(),detail=$('feedbackDetail').value.trim(),device=$('feedbackDevice').value.trim();
 if(!title||!detail){$('feedbackStatus').textContent='请填写标题和具体内容。';return null}
 return {title:'['+type+'] '+title,body:'### 反馈类型\n'+type+'\n\n### 具体内容\n'+detail+'\n\n### 设备与浏览器\n'+(device||'未填写')+'\n\n### 应用版本\nXG Prime 5.5 Web\n\n---\n由 XG Prime 反馈入口生成；提交前请检查内容，不要包含个人隐私。'};
}
$('feedbackForm').addEventListener('submit',e=>{
 e.preventDefault();const item=buildFeedbackBody();if(!item)return;
 const url='https://github.com/XGodxx999/XG/issues/new?title='+encodeURIComponent(item.title)+'&body='+encodeURIComponent(item.body);
 window.open(url,'_blank','noopener');
 $('feedbackStatus').textContent='已打开 GitHub 反馈页面。请检查内容并在 GitHub 页面手动提交。';
});
$('feedbackCopy').onclick=async()=>{
 const item=buildFeedbackBody();if(!item)return;
 try{await navigator.clipboard.writeText(item.title+'\n\n'+item.body);$('feedbackStatus').textContent='反馈内容已复制。';}
 catch(e){$('feedbackStatus').textContent='无法自动复制，请使用“前往提交反馈”打开 GitHub 页面。';}
};
/* Monthly calendar and local schedule records. */
const CALENDAR_STORE='xg-prime-calendar-v1';let calendarEvents=[];let calendarView=new Date();let calendarSelected=(function(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})();
try{const saved=JSON.parse(localStorage.getItem(CALENDAR_STORE)||'[]');if(Array.isArray(saved))calendarEvents=saved.filter(x=>x&&typeof x.title==='string'&&typeof x.date==='string')}catch(e){calendarEvents=[]}
function localDateKey(y,m,d){return y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')}
function drawCalendar(){
 const y=calendarView.getFullYear(),m=calendarView.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate();
 $('calMonthTitle').textContent=y+'年'+(m+1)+'月';
 const labels=['日','一','二','三','四','五','六'];let html=labels.map(x=>'<span class="calendar-weekday">'+x+'</span>').join('');
 for(let i=0;i<first.getDay();i++)html+='<span class="calendar-empty"></span>';
 for(let d=1;d<=days;d++){const key=localDateKey(y,m,d),count=calendarEvents.filter(x=>x.date===key).length;html+='<button type="button" class="calendar-day '+(key===calendarSelected?'selected':'')+'" data-cal-date="'+key+'"><span>'+d+'</span>'+(count?'<i>'+count+'</i>':'')+'</button>'}
 $('calGrid').innerHTML=html;$('calDate').value=calendarSelected;
 const filter=$('calFilter').value,items=calendarEvents.slice().sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))).filter(x=>filter==='all'||(filter==='done'?x.done:filter==='upcoming'?!x.done:x.date===calendarSelected));
 $('calList').innerHTML=items.map(x=>'<div class="listrow"><span>'+safe(x.title)+'<small class="muted" style="display:block">'+safe(x.date)+' '+safe(x.time||'')+' '+safe(x.note||'')+'</small></span><button class="btn secondary" data-cal-done="'+x.id+'">'+(x.done?'撤销':'完成')+'</button><button class="btn danger" data-cal-del="'+x.id+'">删除</button></div>').join('')||'<p class="muted">这一天暂无日程。</p>';
}
$('calPrev').onclick=()=>{calendarView.setMonth(calendarView.getMonth()-1);drawCalendar()};
$('calNext').onclick=()=>{calendarView.setMonth(calendarView.getMonth()+1);drawCalendar()};
$('calGrid').onclick=e=>{const key=e.target.closest('[data-cal-date]')?.dataset.calDate;if(!key)return;calendarSelected=key;const p=key.split('-').map(Number);calendarView=new Date(p[0],p[1]-1,1);drawCalendar()};
$('calFilter').onchange=drawCalendar;
$('calAdd').onclick=()=>{const title=$('calTitle').value.trim(),date=$('calDate').value;if(!title||!date){$('calTitle').focus();return}calendarEvents.push({id:String(Date.now())+String(Math.floor(Math.random()*1000)),title,date,time:$('calTime').value,note:$('calNote').value.trim(),done:false});localStorage.setItem(CALENDAR_STORE,JSON.stringify(calendarEvents));calendarSelected=date;const p=date.split('-').map(Number);calendarView=new Date(p[0],p[1]-1,1);$('calTitle').value='';$('calNote').value='';drawCalendar()};
$('calList').onclick=e=>{const done=e.target.dataset.calDone,del=e.target.dataset.calDel;if(done){const item=calendarEvents.find(x=>String(x.id)===done);if(item)item.done=!item.done}else if(del)calendarEvents=calendarEvents.filter(x=>String(x.id)!==del);localStorage.setItem(CALENDAR_STORE,JSON.stringify(calendarEvents));drawCalendar()};
/* Full local backup and restore, including the calendar workspace. */
function exportAllData(){
 const backup={format:'xg-prime-backup',version:4,exportedAt:new Date().toISOString(),data:data,workbench:workData,notes:notes,calendar:calendarEvents,language:localStorage.getItem('xg-prime-language')||$('settingsLanguage').value,theme:localStorage.getItem('xg-prime-theme')||'dark'};
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='xg-prime-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('export').onclick=exportAllData;$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{
 const file=e.target.files&&e.target.files[0];if(!file)return;
 try{
  const obj=JSON.parse(await file.text());if(!obj||obj.format!=='xg-prime-backup'||!obj.data||!Array.isArray(obj.data.goals)||!Array.isArray(obj.data.tx))throw Error('备份文件格式不正确');
  const restored={goals:obj.data.goals.filter(x=>x&&typeof x.text==='string').slice(0,1000),tx:obj.data.tx.filter(x=>x&&Number.isFinite(Number(x.amount))&&Number(x.amount)>0).slice(0,5000),career:Array.isArray(obj.data.career)?obj.data.career:[],investments:Array.isArray(obj.data.investments)?obj.data.investments:[],careerJobs:Array.isArray(obj.data.careerJobs)?obj.data.careerJobs:[],learned:Array.isArray(obj.data.learned)?obj.data.learned:[],seeded:true};
  if(obj.workbench&&typeof obj.workbench==='object'){workData={tasks:Array.isArray(obj.workbench.tasks)?obj.workbench.tasks.filter(x=>x&&typeof x.title==='string').slice(0,1000):[],habits:Array.isArray(obj.workbench.habits)?obj.workbench.habits.filter(x=>x&&typeof x.name==='string'&&Array.isArray(x.logs)).slice(0,100):[]};localStorage.setItem(WORK_STORE,JSON.stringify(workData))}
  if(Array.isArray(obj.notes)){notes=obj.notes.filter(x=>x&&typeof x.text==='string').slice(0,500);localStorage.setItem(NOTE_STORE,JSON.stringify(notes))}
  if(Array.isArray(obj.calendar)){calendarEvents=obj.calendar.filter(x=>x&&typeof x.title==='string'&&typeof x.date==='string').slice(0,2000);localStorage.setItem(CALENDAR_STORE,JSON.stringify(calendarEvents))}
  data=restored;localStorage.setItem(STORE,JSON.stringify(data));render();drawWorkbench();drawNotes();drawCalendar();
  if(['zh-CN','en','ja','ko','es','fr'].includes(obj.language)){localStorage.setItem('xg-prime-language',obj.language);$('settingsLanguage').value=obj.language}
  if(obj.theme==='light'||obj.theme==='dark'){localStorage.setItem('xg-prime-theme',obj.theme);(obj.theme==='light'?$('themeLight'):$('themeDark')).click()}
  alert('数据已恢复。'); 
 }catch(err){alert(err&&err.message?err.message:'导入失败，请检查备份文件。')}
 e.target.value='';
};
$('reset').onclick=()=>{if(!confirm('确定清空本机保存的 XG Prime 数据吗？此操作不可撤销，请先导出备份。'))return;[STORE,LEGACY_STORE,'xg-prime-data','xg-prime-workbench-v1','xg-prime-notes-v1','xg-prime-calendar-v1','xg-prime-language'].forEach(k=>localStorage.removeItem(k));location.reload()};
render();if(typeof applyLanguage==='function'&&typeof currentLanguage!=='undefined')applyLanguage(currentLanguage);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
