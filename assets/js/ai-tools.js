(()=> {
'use strict';
const API='https://xg-prime-ai.onrender.com';
const toolLabels={focus:'专注计时',language:'英汉语言',calc:'计算与换算',browser:'浏览与搜索',notes:'快速备忘',calendar:'日历中心',data:'数据中心',productivity:'效率工具',developer:'开发者工具',network:'网络诊断',ai:'AI 工作台',exchange:'汇率换算',creative:'图片与创作'};
const pageLabels={home:'首页与个人概览',goals:'每日目标',learn:'英语学习',money:'财务管理',career:'职业发展',workspace:'任务与习惯',me:'个人设置'};
const $=id=>document.getElementById(id);
function labelFor(root){return toolLabels[root.dataset.toolSection]||pageLabels[root.id]||root.querySelector('.pageTitle')?.textContent?.trim()||'XG Prime 工具';}
function collect(root){
 const out=[];
 root.querySelectorAll('input,textarea,select').forEach(el=>{
  if(['password','file','hidden'].includes(el.type)||el.disabled)return;
  const v=el.type==='checkbox'||el.type==='radio'?(el.checked?'已选中':'未选中'):String(el.value||'').trim();
  if(v)out.push((el.getAttribute('aria-label')||el.placeholder||el.id||el.name||'字段')+': '+v.slice(0,1400));
 });
 root.querySelectorAll('.result:not(.xg-ai-result),[aria-live="polite"]').forEach(el=>{const v=(el.innerText||'').trim();if(v&&v!=='—'&&v.length<900)out.push('当前结果：'+v)});
 return [...new Set(out)].slice(0,22).join('\n').slice(0,8500);
}
function setValue(id,value){const el=$(id);if(!el)throw Error('页面缺少控件：'+id);el.value=String(value??'');el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return el;}
function click(id){const el=$(id);if(!el)throw Error('页面缺少操作按钮：'+id);el.click();}
function applyAction(a){
 const t=a?.type;
 switch(t){
  case 'add_goal':setValue('goalInput',a.title);click('addGoal');break;
  case 'add_note':setValue('noteInput',a.text);click('noteAdd');break;
  case 'add_task':setValue('workTaskInput',a.title);if(a.due)setValue('workTaskDate',a.due);if(a.priority)setValue('workTaskPriority',a.priority);click('workTaskAdd');break;
  case 'add_habit':setValue('workHabitInput',a.name);click('workHabitAdd');break;
  case 'add_calendar_event':setValue('calTitle',a.title);setValue('calDate',a.date);if(a.time)setValue('calTime',a.time);if(a.note)setValue('calNote',a.note);click('calAdd');break;
  case 'add_transaction':setValue('type',a.kind==='income'?'income':'expense');setValue('amount',a.amount);if(a.memo)setValue('memo',a.memo);click('addTx');break;
  case 'translate':setValue('translateInput',a.text);click('translateBtn');break;
  case 'calculate':setValue('calcExpression',a.expression);click('calculate');break;
  case 'format_json':setValue('jsonInput',a.text);click('jsonFormat');break;
  case 'encode_base64':setValue('codecInput',a.text);click('base64Encode');break;
  case 'decode_base64':setValue('codecInput',a.text);click('base64Decode');break;
  case 'start_focus':click('focusStart');break;
  case 'reset_focus':click('focusReset');break;
  case 'url_encode':setValue('codecInput',a.text);click('urlEncode');break;
  case 'url_decode':setValue('codecInput',a.text);click('urlDecode');break;
  case 'text_stats':setValue('textUtilityInput',a.text);break;
  case 'countdown':setValue('countdownMinutes',a.minutes);click('countdownStart');break;
  case 'unit_convert':setValue('unitCategory',a.category);setValue('unitValue',a.value);setValue('unitFrom',a.from);setValue('unitTo',a.to);click('unitConvert');break;
  case 'exchange_convert':setValue('exchangeAmount',a.amount);setValue('exchangeFrom',a.from);setValue('exchangeTo',a.to);click('exchangeRun');break;
  case 'text_transform':setValue('textUtilityInput',a.text);{const b=document.querySelector('[data-text-action="'+a.action+'"]');if(!b)throw Error('不支持的文本处理方式');b.click();}break;
  case 'generate_uuid':click('uuidGenerate');break;
  case 'generate_password':setValue('passwordLength',a.length||16);click('passwordGenerate');break;
  case 'image_options':setValue('xgImageMax',a.max||1600);setValue('xgImageQuality',a.quality||82);setValue('xgImageFormat',a.format||'image/webp');break;
  case 'open_search':setValue('browserInput',a.query);click('browserOpen');break;
  default:throw Error('此操作暂不支持自动执行：'+String(t));
 }
}
function actionLabel(a){
 const names={add_goal:'新增目标',add_note:'保存备忘',add_task:'创建任务',add_habit:'添加习惯',add_calendar_event:'添加日程',add_transaction:'新增收支记录',translate:'执行翻译',calculate:'执行计算',format_json:'格式化 JSON',encode_base64:'Base64 编码',decode_base64:'Base64 解码',start_focus:'启动专注计时',reset_focus:'重置专注计时',url_encode:'URL 编码',url_decode:'URL 解码',text_stats:'填入文本处理工具',countdown:'启动倒计时',unit_convert:'执行单位换算',exchange_convert:'执行汇率换算',text_transform:'执行文本处理',generate_uuid:'生成 UUID',generate_password:'本机生成密码',image_options:'设置图片压缩参数',open_search:'打开浏览器搜索'};
 return names[a.type]||a.type;
}
function normalizePlan(raw){
 let parsed;
 try{parsed=JSON.parse(raw)}catch{
  const match=raw.match(/\{[\s\S]*\}/);if(match){try{parsed=JSON.parse(match[0])}catch{}}
 }
 if(!parsed||typeof parsed!=='object')return {message:raw,actions:[]};
 return {message:typeof parsed.message==='string'?parsed.message:'AI 已生成操作方案。',actions:Array.isArray(parsed.actions)?parsed.actions.slice(0,5):[]};
}
async function ask(root,button){
 const task=window.prompt('输入希望 AI 完成的任务：\n例如：帮我创建任务、保存备忘、计算表达式或整理日程。');
 if(!task||!task.trim())return;
 const context=collect(root);
 const include=context?window.confirm('检测到当前工具的输入或结果。\n确定：发送给 AI；取消：只发送任务描述。'):false;
 const messages=[
  {role:'system',content:'你是 XG Prime 的工具执行助手。根据当前工具和用户要求，返回严格 JSON，不要使用 Markdown 代码块。格式：{"message":"简短说明","actions":[{"type":"...","title":"..."}]}。只允许以下操作类型及字段：add_goal{title}; add_note{text}; add_task{title,due可选YYYY-MM-DD,priority可选normal/high/low}; add_habit{name}; add_calendar_event{title,date必填YYYY-MM-DD,time可选HH:MM,note可选}; add_transaction{kind为income或expense,amount为正数,memo可选}; translate{text}; calculate{expression}; format_json{text}; encode_base64{text}; decode_base64{text}; start_focus{}; reset_focus{}; text_stats{text}; countdown{minutes}; unit_convert{category,value,from,to}; exchange_convert{amount,from,to}; text_transform{action为upper/lower/trim,text}; generate_uuid{}; generate_password{length}; image_options{max,quality,format为image/webp/image/jpeg/image/png}。每次最多提出5个操作。不要提出删除、导入备份、清空数据、外部支付、投资买卖、发送消息、打开外部网站或上传文件等操作。只提出用户明确要求的操作，不得擅自新增。财务记录必须严格按用户提供的金额和收支方向。日期缺失时不要猜测，改为在message中询问。对于当前页面不具备的控件，不要提出操作。若任务仅需解释或分析，actions返回空数组。'},
  {role:'user',content:'当前页面：'+labelFor(root)+'\n用户要求：'+task.trim()+(include?'\n用户确认提供的页面输入与结果：\n'+context:'')}
 ];
 const original=button.textContent;button.disabled=true;button.textContent='AI 处理中…';
 let box=root.querySelector('.xg-ai-result');
 if(!box){box=document.createElement('section');box.className='result xg-ai-result';box.style.cssText='white-space:pre-wrap;margin-top:12px;padding:14px;line-height:1.65';root.append(box);}
 box.textContent='正在请求 AI…';
 try{
  const response=await fetch(API+'/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,stream:false,temperature:0.2})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||('HTTP '+response.status));
  let raw=data.choices?.[0]?.message?.content;if(Array.isArray(raw))raw=raw.map(x=>x.text||'').join('');if(typeof raw!=='string'||!raw.trim())throw Error('模型没有返回有效内容');
  const plan=normalizePlan(raw);box.replaceChildren();
  const msg=document.createElement('p');msg.textContent=plan.message;box.append(msg);
  if(plan.actions.length){
   const list=document.createElement('ol');plan.actions.forEach(a=>{const li=document.createElement('li');li.textContent=actionLabel(a)+'：'+JSON.stringify(a);list.append(li)});box.append(list);
   const run=document.createElement('button');run.type='button';run.className='btn';run.textContent='确认并执行 '+plan.actions.length+' 项操作';run.addEventListener('click',()=>{
    if(!window.confirm('即将修改此设备中 XG Prime 的本地数据或执行工具操作。\n\n'+plan.actions.map(actionLabel).join('\n')+'\n\n确认执行？'))return;
    const done=[],failed=[];for(const a of plan.actions){try{applyAction(a);done.push(actionLabel(a))}catch(e){failed.push(actionLabel(a)+'：'+e.message)}}
    const status=document.createElement('p');status.textContent=(done.length?'已执行：'+done.join('、'):'没有操作成功')+(failed.length?'；失败：'+failed.join('；'):'');box.append(status);run.disabled=true;run.textContent='执行完成';
   });box.append(run);
  }
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(error){box.textContent='AI 请求失败：'+error.message;}
 finally{button.disabled=false;button.textContent=original;}
}
function add(root){
 if(root.querySelector('[data-ai-tool-button]'))return;
 const head=root.querySelector('.cathead')||root.querySelector('.pageHead');if(!head)return;
 const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='AI 辅助此工具';button.dataset.aiToolButton='true';button.style.cssText='margin:10px 0;max-width:100%';button.addEventListener('click',()=>ask(root,button));head.append(button);
}
document.querySelectorAll('.tool-section[data-tool-section],.page[id]').forEach(add);
})();