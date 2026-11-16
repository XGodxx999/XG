(()=> {
'use strict';
const API='https://xg-prime-ai.onrender.com';
const toolLabels={focus:'专注计时',language:'英汉语言',calc:'计算与换算',browser:'浏览与搜索',notes:'快速备忘',calendar:'日历中心',data:'数据中心',productivity:'效率工具',developer:'开发者工具',network:'网络诊断',ai:'AI 工作台',exchange:'汇率换算',creative:'图片与创作'};
const pageLabels={home:'首页与个人概览',goals:'每日目标',learn:'英语学习',money:'财务管理',career:'职业发展',workspace:'任务与习惯',me:'个人设置'};
function labelFor(root){return toolLabels[root.dataset.toolSection]||pageLabels[root.id]||root.querySelector('.pageTitle')?.textContent?.trim()||'XG Prime 工具';}
function collect(root){
 const out=[];
 root.querySelectorAll('input,textarea,select').forEach(el=>{
  if(el.type==='password'||el.type==='file'||el.type==='hidden'||el.disabled)return;
  let v='';
  if(el.type==='checkbox'||el.type==='radio')v=el.checked?'已选中':'未选中';
  else v=String(el.value||'').trim();
  if(!v)return;
  const name=el.getAttribute('aria-label')||el.placeholder||el.id||el.name||'字段';
  out.push(name+': '+v.slice(0,1800));
 });
 root.querySelectorAll('.result:not(.xg-ai-result),[aria-live="polite"]').forEach(el=>{
  const v=(el.innerText||'').trim();
  if(v&&v!=='—'&&v.length<1200)out.push('当前结果：'+v);
 });
 return [...new Set(out)].slice(0,24).join('\n').slice(0,9000);
}
async function ask(root,button){
 const task=window.prompt('输入希望 AI 在此工具中完成的任务：\n例如：解释结果、分析数据、生成计划、检查错误。');
 if(!task||!task.trim())return;
 const context=collect(root);
 const include=context?window.confirm('检测到当前工具的输入或结果。\n确定：将这些内容发送给 AI；取消：只发送任务描述。'):false;
 const messages=[
  {role:'system',content:'你是 XG Prime 的内置工具助手。你必须围绕当前工具完成用户任务，优先给出可直接使用的结果、步骤或修正内容。信息不足时指出缺失，不得虚构。除非用户明确要求，不要声称已替用户修改本地数据、执行计算器操作、保存文件或访问外部网站。回答使用用户当前语言；默认简体中文。'},
  {role:'user',content:'当前工具：'+labelFor(root)+'\n用户任务：'+task.trim()+(include?'\n用户明确允许提供的当前输入与结果：\n'+context:'')}
 ];
 const original=button.textContent;button.disabled=true;button.textContent='AI 处理中…';
 let result=root.querySelector('.xg-ai-result');
 if(!result){result=document.createElement('section');result.className='result xg-ai-result';result.setAttribute('aria-live','polite');result.style.cssText='white-space:pre-wrap;margin-top:12px;padding:14px;line-height:1.65';root.append(result);}
 result.textContent='正在请求 AI…';
 try{
  const response=await fetch(API+'/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,stream:false,temperature:0.35})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||('HTTP '+response.status));
  let answer=data.choices?.[0]?.message?.content;
  if(Array.isArray(answer))answer=answer.map(x=>x.text||'').join('');
  if(typeof answer!=='string'||!answer.trim())throw new Error('模型没有返回有效内容');
  result.textContent=answer.trim();result.scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(error){result.textContent='AI 请求失败：'+error.message;}
 finally{button.disabled=false;button.textContent=original;}
}
function add(root){
 if(root.querySelector('[data-ai-tool-button]'))return;
 const head=root.querySelector('.cathead')||root.querySelector('.pageHead');
 if(!head)return;
 const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='AI 辅助此工具';button.dataset.aiToolButton='true';button.style.cssText='margin:10px 0;max-width:100%';
 button.addEventListener('click',()=>ask(root,button));head.append(button);
}
document.querySelectorAll('.tool-section[data-tool-section],.page[id]').forEach(add);
})();