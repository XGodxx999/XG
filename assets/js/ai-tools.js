(()=> {
'use strict';
const API='https://xg-prime-ai.onrender.com';
const labels={focus:'专注计时',language:'英汉语言',calc:'计算与换算',browser:'浏览与搜索',notes:'快速备忘',calendar:'日历中心',data:'数据中心',productivity:'效率工具',developer:'开发者工具',network:'网络诊断',ai:'AI 工作台',exchange:'汇率换算',creative:'图片与创作'};
function getContext(section){
 const fields=[...section.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea,select')];
 return fields.map(el=>{const value=String(el.value||'').trim();if(!value)return '';const label=el.getAttribute('aria-label')||el.placeholder||el.id||el.name||'当前字段';return label+': '+value.slice(0,5000)}).filter(Boolean).join('\n');
}
async function ask(section){
 const task=window.prompt('你希望 AI 帮你完成什么？\n例如：解释内容、检查错误、总结重点、给出下一步建议。');
 if(!task||!task.trim())return;
 const context=getContext(section);
 const include=context?window.confirm('检测到当前工具有已填写内容。\n点击“确定”将把这些字段发送给 AI；点击“取消”只发送你的任务描述。'):false;
 const messages=[{role:'system',content:'你是 XG Prime 的工具辅助助手。回答简洁、准确、可执行。若信息不足，明确说明，不要编造。'},{role:'user',content:'工具：'+(labels[section.dataset.toolSection]||'XG 工具')+'\n任务：'+task.trim()+(include?'\n用户选择提供的当前字段：\n'+context:'')}];
 const button=section.querySelector('[data-ai-tool-button]'),original=button.textContent;button.disabled=true;button.textContent='AI 处理中…';
 try{
  const response=await fetch(API+'/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,stream:false,temperature:0.4})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||('HTTP '+response.status));
  let answer=data.choices?.[0]?.message?.content;if(Array.isArray(answer))answer=answer.map(x=>x.text||'').join('');
  if(typeof answer!=='string'||!answer.trim())throw new Error('模型没有返回有效内容');
  let box=section.querySelector('.xg-ai-result');if(!box){box=document.createElement('div');box.className='result xg-ai-result';box.setAttribute('aria-live','polite');section.append(box)}
  box.textContent=answer;box.scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(error){window.alert('AI 请求失败：'+error.message)}
 finally{button.disabled=false;button.textContent=original}
}
document.querySelectorAll('.tool-section[data-tool-section]').forEach(section=>{
 if(section.querySelector('[data-ai-tool-button]'))return;
 const head=section.querySelector('.cathead');if(!head)return;
 const button=document.createElement('button');button.type='button';button.className='btn secondary';button.textContent='AI 辅助此工具';button.dataset.aiToolButton='true';button.style.margin='10px 0';button.addEventListener('click',()=>ask(section));head.append(button);
});
})();