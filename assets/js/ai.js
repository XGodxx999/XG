(()=>{
'use strict';
const $=id=>document.getElementById(id);
const send=$('aiSend');
if(!send)return;
const API='https://xg-prime-ai.onrender.com';
const system=$('aiSystem'),prompt=$('aiPrompt'),messagesEl=$('aiMessages'),status=$('aiStatus'),stop=$('aiStop');
let history=[],controller=null,serviceReady=false;
const presets={
 explain:'请用通俗语言解释下面的概念，先给结论，再分步骤说明，并提供一个例子。',
 translate:'请翻译以下内容，保留原意，并解释关键表达、语法和自然用法。',
 write:'请帮助我改进以下文字，保持原意，提升清晰度、结构和表达准确性。',
 code:'请分析以下代码，指出问题原因，给出可执行的修复方案，并解释关键修改。',
 plan:'请把以下目标拆解为明确、可执行、可衡量的步骤，标注优先级和风险。'
};
function setStatus(message){if(status)status.textContent=message;}
function setBusy(value){send.disabled=value;stop.disabled=!value;}
function addMessage(role,content){
 const empty=messagesEl.querySelector('.ai-empty');if(empty)empty.remove();
 const el=document.createElement('div');el.className='ai-message '+role;
 const label=document.createElement('small');label.textContent=role==='user'?'You':role==='assistant'?'AI':'Error';
 const body=document.createElement('div');body.textContent=content;
 el.append(label,body);messagesEl.append(el);messagesEl.scrollTop=messagesEl.scrollHeight;return body;
}
async function checkService(){
 const config=$('aiConfigStatus');
 try{
  const response=await fetch(API+'/health',{cache:'no-store'});
  const data=await response.json();
  if(!response.ok||!data.ok)throw new Error('health check failed');
  serviceReady=!!data.configured;
  config.textContent=serviceReady?'AI 服务已连接，可以开始对话。':'XG 后端在线，模型服务尚未配置。';
  config.dataset.state=serviceReady?'ready':'pending';
 }catch(error){
  serviceReady=false;config.textContent='暂时无法连接 AI 服务，请稍后重试。';config.dataset.state='error';
 }
}
$('aiApplyPreset')?.addEventListener('click',()=>{
 const value=$('aiPreset').value;if(presets[value]){prompt.value=presets[value];prompt.focus();}
});
async function sendMessage(){
 const text=prompt.value.trim();if(!text)return;
 if(!serviceReady){await checkService();if(!serviceReady){setStatus('AI 服务尚未配置，请稍后再试。');return;}}
 const userMessage={role:'user',content:text};
 const nextHistory=$('aiRemember').checked?[...history,userMessage]:[userMessage];
 addMessage('user',text);prompt.value='';
 const assistant=addMessage('assistant','');setBusy(true);controller=new AbortController();let answer='';
 setStatus('正在连接 AI 服务…');
 const messages=[{role:'system',content:system.value.trim()||'你是一个准确、清晰、高效的 AI 助手。优先使用用户当前选择的语言回答。'},...nextHistory];
 try{
  const response=await fetch(API+'/api/ai',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({messages,temperature:Math.min(1,Math.max(0,Number($('aiTemperature').value)||0.7)),stream:$('aiStream').checked}),
   signal:controller.signal
  });
  if(!response.ok){
   let detail='';try{const data=await response.json();detail=data.error||data.message||JSON.stringify(data)}catch(error){detail=await response.text().catch(()=> '')}
   throw new Error('HTTP '+response.status+(detail?'：'+detail.slice(0,300):''));
  }
  if($('aiStream').checked&&response.body){
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   while(true){
    const {value,done}=await reader.read();if(done)break;
    buffer+=decoder.decode(value,{stream:true});
    const lines=buffer.split(/\r?\n/);buffer=lines.pop()||'';
    for(const line of lines){
     if(!line.startsWith('data:'))continue;
     const raw=line.slice(5).trim();if(!raw||raw==='[DONE]')continue;
     let packet;try{packet=JSON.parse(raw)}catch(error){continue}
     if(packet.error)throw new Error(packet.error.message||'模型返回错误');
     const delta=packet.choices?.[0]?.delta?.content;
     if(typeof delta==='string'){answer+=delta;assistant.textContent=answer;messagesEl.scrollTop=messagesEl.scrollHeight;}
    }
   }
   if(buffer.startsWith('data:')){
    const raw=buffer.slice(5).trim();
    if(raw&&raw!=='[DONE]'){try{const packet=JSON.parse(raw),delta=packet.choices?.[0]?.delta?.content;if(typeof delta==='string')answer+=delta}catch(error){}}
   }
  }else{
   const data=await response.json();answer=data.choices?.[0]?.message?.content;
   if(Array.isArray(answer))answer=answer.map(item=>item.text||'').join('');
   if(typeof answer!=='string')throw new Error('模型返回格式不受支持');
  }
  if(!answer)answer='模型没有返回文本内容。';
  assistant.textContent=answer;
  if($('aiRemember').checked)history=nextHistory.concat({role:'assistant',content:answer});
  else history=[];
  setStatus('回答完成。');
 }catch(error){
  if(error.name==='AbortError'){setStatus('已停止生成。');if(answer&&$('aiRemember').checked)history=nextHistory.concat({role:'assistant',content:answer});}
  else{assistant.textContent='请求失败：'+error.message;assistant.parentElement.classList.add('error');setStatus('请求未完成，请检查模型服务配置或稍后重试。');}
 }finally{setBusy(false);controller=null;}
}
send.addEventListener('click',sendMessage);
prompt.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();if(!send.disabled)sendMessage();}});
stop.addEventListener('click',()=>controller?.abort());
$('aiNewChat')?.addEventListener('click',()=>{
 if(controller)controller.abort();history=[];messagesEl.replaceChildren();
 const empty=document.createElement('div');empty.className='ai-empty';empty.textContent='新对话已开始。';messagesEl.append(empty);setStatus('对话上下文已清除。');
});
checkService();
})();