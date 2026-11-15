
(()=>{
 const $=id=>document.getElementById(id);
 const file=$('xgImageFile'),convert=$('xgImageConvert');
 if(file&&convert){
  let imageUrl='';
  file.addEventListener('change',()=>{
   const f=file.files&&file.files[0];$('xgImageStatus').textContent=f?f.name+' · '+(f.size/1024).toFixed(1)+' KB':'选择图片后开始处理';
   const preview=$('xgImagePreview');if(imageUrl)URL.revokeObjectURL(imageUrl);
   imageUrl=f?URL.createObjectURL(f):'';
   if(preview){preview.src=imageUrl;preview.hidden=!f;preview.style.display=f?'block':'none'}
  });
  convert.addEventListener('click',()=>{
   const f=file.files&&file.files[0],status=$('xgImageStatus');if(!f){status.textContent='请先选择图片';return}
   const max=Math.min(6000,Math.max(100,Number($('xgImageMax').value)||1600)),quality=Math.min(1,Math.max(.1,(Number($('xgImageQuality').value)||82)/100)),format=$('xgImageFormat').value;
   const img=new Image();const url=URL.createObjectURL(f);
   img.onload=()=>{URL.revokeObjectURL(url);const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d');if(format==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height)}ctx.drawImage(img,0,0,canvas.width,canvas.height);
    canvas.toBlob(blob=>{if(!blob){status.textContent='浏览器无法生成该格式，请更换格式重试';return}const ext=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg',a=document.createElement('a'),out=URL.createObjectURL(blob);a.href=out;a.download=(f.name.replace(/\.[^.]+$/,'')||'image')+'-xg.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(out),1500);status.textContent=canvas.width+' × '+canvas.height+' · '+(blob.size/1024).toFixed(1)+' KB（原图 '+(f.size/1024).toFixed(1)+' KB）'},format,quality)
   };img.onerror=()=>{URL.revokeObjectURL(url);status.textContent='图片读取失败或格式不受支持'};img.src=url;
  });
 }
 const colorInput=$('xgColorInput');
 function parseColor(v){let m=v.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i),r,g,b;if(m){let h=m[1];if(h.length===3)h=h.split('').map(x=>x+x).join('');r=parseInt(h.slice(0,2),16);g=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16)}else{m=v.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);if(!m)return null;[r,g,b]=m.slice(1).map(Number);if([r,g,b].some(x=>x>255))return null}const [rr,gg,bb]=[r,g,b].map(x=>x/255),mx=Math.max(rr,gg,bb),mn=Math.min(rr,gg,bb),d=mx-mn;let h=0,s=0,l=(mx+mn)/2;if(d){s=d/(1-Math.abs(2*l-1));switch(mx){case rr:h=((gg-bb)/d)%6;break;case gg:h=(bb-rr)/d+2;break;default:h=(rr-gg)/d+4}h*=60;if(h<0)h+=360}return{r,g,b,hex:'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase(),hsl:'HSL '+Math.round(h)+', '+Math.round(s*100)+'%, '+Math.round(l*100)+'%'}}
 function updateColor(){if(!colorInput)return;const c=parseColor(colorInput.value),out=$('xgColorResult'),swatch=$('xgColorSwatch');if(!c){out.textContent='格式无效。请输入 #RGB、#RRGGBB 或 rgb(r,g,b)。';swatch.style.background='transparent';return}out.textContent='HEX '+c.hex+' · RGB '+c.r+', '+c.g+', '+c.b+' · '+c.hsl;swatch.style.background=c.hex}
 if(colorInput){colorInput.addEventListener('input',updateColor);updateColor()}
 const copy=$('xgColorCopy');if(copy)copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('xgColorResult').textContent);copy.textContent='已复制';setTimeout(()=>copy.textContent='复制颜色信息',1200)}catch(e){copy.textContent='复制失败，请手动选择'}})
 const md=$('xgMarkdownInput'),preview=$('xgMarkdownPreview');
 function esc(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
 function inline(s){return esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>')}
 function renderMd(src){let html='',list=false;for(const line of src.split(/\r?\n/)){if(/^\s*[-*+]\s+/.test(line)){if(!list){html+='<ul>';list=true}html+='<li>'+inline(line.replace(/^\s*[-*+]\s+/,''))+'</li>';continue}if(list){html+='</ul>';list=false}const h=line.match(/^(#{1,3})\s+(.+)$/);if(h)html+='<h'+h[1].length+'>'+inline(h[2])+'</h'+h[1].length+'>';else if(line.trim())html+='<p>'+inline(line)+'</p>';else html+='<div style="height:6px"></div>'}if(list)html+='</ul>';return html||'预览会显示在这里'}
 if(md&&preview)md.addEventListener('input',()=>preview.innerHTML=renderMd(md.value));
})();
