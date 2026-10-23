/* Reservas online · Home Sushi Benidorm
   Se abre desde cualquier elemento con [data-reserva] y envía la solicitud por email con Web3Forms. */
(()=>{
'use strict';

/* ===== CONFIGURACIÓN ===== */
const CONFIG={
  // Clave de https://web3forms.com: las reservas llegan al email con el que se creó (coloma.zurita@gmail.com)
  web3formsKey:'6af8b537-83d7-4c35-820e-efc2162a2ced',
  whatsapp:'34677228402', // número al que el cliente puede mandar la reserva por WhatsApp (con prefijo, sin +)
  telefono:'+34622258858',
  telefonoVisible:'622 25 88 58',
  aforo:null,          // plazas totales del local; cuando se sepa, el máximo por reserva será porcentajeMax de este número
  porcentajeMax:.20,
  maxSinAforo:10,      // máximo por reserva mientras no se indique el aforo
  turnos:[             // horas en las que se puede reservar (última hora incluida)
    {id:'comida',desde:'12:00',hasta:'15:00'},
    {id:'cena',desde:'18:00',hasta:'22:30'}
  ],
  intervalo:30,        // minutos entre horas
  margen:60,           // antelación mínima en minutos para reservar el mismo día
  diasVista:60,        // días hacia delante que se pueden reservar
  cerrados:[]          // fechas sin reservas online, formato 'AAAA-MM-DD'
};

const tel=()=>`<a href="tel:${CONFIG.telefono}">${CONFIG.telefonoVisible}</a>`;
const TXT={
es:{loc:'es-ES',eyebrow:'Reserva online · Home Sushi',
  steps:['Personas','Fecha','Hora','Datos','Confirmar'],
  q:['¿Cuántos sois?','¿Qué día venís?','¿A qué hora?','Tus datos','Revisa tu reserva'],
  pers:n=>n===1?'1 persona':n+' personas',
  more:n=>`¿Sois más de ${n}? Llámanos al ${tel()} y te buscamos sitio.`,
  turnos:{comida:'Mediodía',cena:'Noche'},
  noSlots:'Ya no quedan horas para reservar este día.',
  prevm:'Mes anterior',nextm:'Mes siguiente',
  f:{nombre:'Nombre',tel:'Teléfono',email:'Email',notas:'Comentarios (opcional)'},
  notasPh:'Alergias, trona, celebración…',
  rgpd:'Acepto que Home Sushi use estos datos únicamente para gestionar mi reserva.',
  err:{req:'Campo obligatorio',tel:'Introduce un teléfono válido',email:'Introduce un email válido',rgpd:'Debes aceptarlo para continuar'},
  sum:{n:'Personas',fecha:'Fecha',hora:'Hora'},
  pending:'La reserva queda pendiente hasta que el restaurante te la confirme por WhatsApp, email o teléfono.',
  back:'Atrás',cont:'Continuar',confirm:'Confirmar reserva',sending:'Enviando…',close:'Cerrar',
  okT:'Solicitud enviada',
  okP:'Hemos recibido tu reserva. Te confirmaremos la mesa lo antes posible por WhatsApp o email.',
  // Mensajes que el restaurante envía al cliente desde los enlaces del email
  siMsg:(n,f,h,p)=>`Hola ${n}, te confirmamos tu reserva en Home Sushi Benidorm para el ${f} a las ${h} (${p}). ¡Te esperamos en C. Ibiza 9!`,
  noMsg:(n,f,h)=>`Hola ${n}, sentimos decirte que no nos queda mesa para el ${f} a las ${h}. ¿Te vendría bien otra hora? Home Sushi Benidorm`,
  fail:()=>`No hemos podido enviar la reserva. Inténtalo de nuevo, llámanos al ${tel()} o envíanosla por WhatsApp.`,
  waBtn:'Enviar también por WhatsApp',
  waHint:'Así te confirmamos la mesa más rápido. Solo tienes que pulsar enviar.',
  waFail:'Enviar por WhatsApp',
  waMsg:'Hola, acabo de hacer una reserva en la web de Home Sushi:',
  waL:{reserva:'Reserva',a:'a las',pers:'Nº de personas',nombre:'Nombre',tel:'Teléfono de confirmación',notas:'Comentarios'}},
en:{loc:'en-GB',eyebrow:'Online booking · Home Sushi',
  steps:['Guests','Date','Time','Details','Confirm'],
  q:['How many of you?','Which day?','What time?','Your details','Check your booking'],
  pers:n=>n===1?'1 guest':n+' guests',
  more:n=>`More than ${n} of you? Call us on ${tel()} and we'll find you a table.`,
  turnos:{comida:'Lunchtime',cena:'Evening'},
  noSlots:'There are no times left to book for this day.',
  prevm:'Previous month',nextm:'Next month',
  f:{nombre:'Name',tel:'Phone',email:'Email',notas:'Comments (optional)'},
  notasPh:'Allergies, high chair, celebration…',
  rgpd:'I agree that Home Sushi may use this data solely to manage my booking.',
  err:{req:'Required field',tel:'Enter a valid phone number',email:'Enter a valid email',rgpd:'Please accept to continue'},
  sum:{n:'Guests',fecha:'Date',hora:'Time'},
  pending:'Your booking is pending until the restaurant confirms it by WhatsApp, email or phone.',
  back:'Back',cont:'Continue',confirm:'Confirm booking',sending:'Sending…',close:'Close',
  okT:'Request sent',
  okP:"We've received your booking. We'll confirm your table as soon as possible by WhatsApp or email.",
  siMsg:(n,f,h,p)=>`Hi ${n}, your table at Home Sushi Benidorm is confirmed for ${f} at ${h} (${p}). See you at C. Ibiza 9!`,
  noMsg:(n,f,h)=>`Hi ${n}, we're sorry but we have no tables left for ${f} at ${h}. Would another time suit you? Home Sushi Benidorm`,
  fail:()=>`We couldn't send your booking. Please try again, call us on ${tel()} or send it to us on WhatsApp.`,
  waBtn:'Also send via WhatsApp',
  waHint:"That way we can confirm your table faster. Just tap send.",
  waFail:'Send via WhatsApp',
  waMsg:"Hi, I've just booked a table on the Home Sushi website:",
  waL:{reserva:'Booking',a:'at',pers:'No. of guests',nombre:'Name',tel:'Contact phone',notas:'Comments'}}
};
const T=()=>TXT[document.documentElement.lang==='en'?'en':'es'];

/* ===== Utilidades de fecha ===== */
const pad=n=>String(n).padStart(2,'0');
const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=k=>{const[y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d);};
const mins=h=>{const[a,b]=h.split(':').map(Number);return a*60+b;};
const hhmm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const hoy=()=>{const d=new Date();d.setHours(0,0,0,0);return d;};
const mesDe=d=>new Date(d.getFullYear(),d.getMonth(),1);
const ultimoDia=()=>{const d=hoy();d.setDate(d.getDate()+CONFIG.diasVista);return d;};
const fmtLargo=(d,loc=T().loc)=>{const s=new Intl.DateTimeFormat(loc,{weekday:'long',day:'numeric',month:'long'}).format(d);return s[0].toUpperCase()+s.slice(1);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const maxPers=()=>CONFIG.aforo?Math.max(1,Math.floor(CONFIG.aforo*CONFIG.porcentajeMax)):CONFIG.maxSinAforo;

// Horas reservables de un día, agrupadas por turno
function horas(k){
  const ahora=new Date(),esHoy=k===key(ahora),lim=ahora.getHours()*60+ahora.getMinutes()+CONFIG.margen;
  return CONFIG.turnos.map(t=>{
    const hs=[];
    for(let m=mins(t.desde);m<=mins(t.hasta);m+=CONFIG.intervalo)if(!esHoy||m>=lim)hs.push(hhmm(m));
    return{id:t.id,horas:hs};
  });
}
const diaLibre=d=>d>=hoy()&&d<=ultimoDia()&&!CONFIG.cerrados.includes(key(d))&&horas(key(d)).some(g=>g.horas.length);

/* ===== Estado ===== */
const VACIO={step:0,n:0,fecha:'',hora:'',turno:'',nombre:'',tel:'',email:'',notas:'',rgpd:false,botcheck:false,mes:null,errores:{},enviando:false,enviado:false,fallo:false};
let S={...VACIO};

// Descarta elecciones que ya no son válidas (p. ej. si se reabre al día siguiente)
function sanear(){
  if(S.n>maxPers())S.n=0;
  if(S.fecha&&!diaLibre(parse(S.fecha)))S.fecha='';
  if(!S.fecha||!horas(S.fecha).some(g=>g.horas.includes(S.hora)))S.hora='';
  S.step=Math.min(S.step,!S.n?0:!S.fecha?1:!S.hora?2:4);
  S.mes=mesDe(S.fecha?parse(S.fecha):hoy());
}

/* ===== Interfaz ===== */
const dlg=document.createElement('dialog');
dlg.className='rv';
dlg.setAttribute('aria-labelledby','rvTitle');
dlg.innerHTML=`<div class="rv-in">
  <header class="rv-hd">
    <div><p class="eyebrow" id="rvEyebrow"></p><h2 id="rvTitle" tabindex="-1"></h2></div>
    <button type="button" class="rv-x" data-act="close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  </header>
  <ol class="rv-prog" id="rvProg"></ol>
  <div class="rv-body" id="rvBody"></div>
  <footer class="rv-ft" id="rvFt"></footer>
</div>`;
document.body.appendChild(dlg);
const $=s=>dlg.querySelector(s);

function pPersonas(t){
  let h='<div class="rv-pers">';
  for(let i=1;i<=maxPers();i++)h+=`<button type="button" class="rv-opt${S.n===i?' sel':''}" data-n="${i}" aria-pressed="${S.n===i}" aria-label="${t.pers(i)}">${i}</button>`;
  return h+`</div><p class="rv-note">${t.more(maxPers())}</p>`;
}

function pFecha(t){
  const m=S.mes,y=m.getFullYear(),mo=m.getMonth();
  const prevOk=m>mesDe(hoy()),nextOk=new Date(y,mo+1,1)<=ultimoDia();
  const wd=new Intl.DateTimeFormat(t.loc,{weekday:'narrow'});
  let h=`<div class="rv-cal-hd">
    <button type="button" class="rv-mbtn" data-act="prevm" aria-label="${t.prevm}"${prevOk?'':' disabled'}>‹</button>
    <span class="rv-mes" aria-live="polite">${new Intl.DateTimeFormat(t.loc,{month:'long',year:'numeric'}).format(m)}</span>
    <button type="button" class="rv-mbtn" data-act="nextm" aria-label="${t.nextm}"${nextOk?'':' disabled'}>›</button>
  </div><div class="rv-cal">`;
  for(let i=0;i<7;i++)h+=`<span class="rv-wd" aria-hidden="true">${wd.format(new Date(2024,0,1+i))}</span>`;
  for(let i=(new Date(y,mo,1).getDay()+6)%7;i>0;i--)h+='<span></span>';
  const hk=key(hoy());
  for(let d=1,n=new Date(y,mo+1,0).getDate();d<=n;d++){
    const f=new Date(y,mo,d),k=key(f),sel=S.fecha===k;
    h+=`<button type="button" class="rv-day${sel?' sel':''}${k===hk?' today':''}" data-d="${k}" aria-pressed="${sel}" aria-label="${fmtLargo(f)}"${diaLibre(f)?'':' disabled'}>${d}</button>`;
  }
  return h+'</div>';
}

function pHora(t){
  const gs=horas(S.fecha).filter(g=>g.horas.length);
  let h=`<p class="rv-when">${fmtLargo(parse(S.fecha))} · ${t.pers(S.n)}</p>`;
  if(!gs.length)return h+`<p class="rv-note">${t.noSlots}</p>`;
  return h+gs.map(g=>`<div class="rv-turno"><h3>${t.turnos[g.id]}</h3><div class="rv-slots">${
    g.horas.map(x=>`<button type="button" class="rv-slot${S.hora===x?' sel':''}" data-h="${x}" data-t="${g.id}" aria-pressed="${S.hora===x}">${x}</button>`).join('')
  }</div></div>`).join('');
}

function campo(t,name,type,auto,extra=''){
  const e=S.errores[name]||'';
  return `<label class="rv-lab"><span>${t.f[name]}</span>
    <input name="${name}" type="${type}" autocomplete="${auto}" value="${esc(S[name])}" aria-invalid="${!!e}" aria-describedby="rvErr-${name}"${extra}>
    <em class="rv-err" id="rvErr-${name}">${e}</em></label>`;
}
function pDatos(t){
  const e=S.errores.rgpd||'';
  return `<form class="rv-f" novalidate>
    ${campo(t,'nombre','text','name',' required')}
    <div class="two">${campo(t,'tel','tel','tel',' required inputmode="tel"')}${campo(t,'email','email','email',' required')}</div>
    <label class="rv-lab"><span>${t.f.notas}</span><textarea name="notas" rows="3" maxlength="500" placeholder="${t.notasPh}">${esc(S.notas)}</textarea></label>
    <label class="rv-chk"><input type="checkbox" name="rgpd"${S.rgpd?' checked':''} aria-invalid="${!!e}" aria-describedby="rvErr-rgpd"><span>${t.rgpd}</span></label>
    <em class="rv-err" id="rvErr-rgpd">${e}</em>
    <input type="checkbox" name="botcheck" class="rv-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <button type="submit" hidden></button>
  </form>`;
}

function resumen(t){
  const fila=(a,b)=>`<div><dt>${a}</dt><dd>${b}</dd></div>`;
  return `<dl class="rv-sum">
    ${fila(t.sum.n,t.pers(S.n))}
    ${fila(t.sum.fecha,fmtLargo(parse(S.fecha)))}
    ${fila(t.sum.hora,`${S.hora} · ${t.turnos[S.turno]}`)}
    ${fila(t.f.nombre,esc(S.nombre.trim()))}
    ${fila(t.f.tel,esc(S.tel.trim()))}
    ${fila(t.f.email,esc(S.email.trim()))}
    ${S.notas.trim()?fila(t.f.notas,esc(S.notas.trim())):''}
  </dl>`;
}
function pResumen(t){
  return resumen(t)+(S.fallo
    ?`<p class="rv-box rv-fail" role="alert">${t.fail()}</p><p class="rv-wa-box">${btnWhatsApp(t,t.waFail,'btn-line')}</p>`
    :`<p class="rv-box">${t.pending}</p>`);
}

const nombreBonito=()=>S.nombre.trim().replace(/(^|\s)\p{L}/gu,c=>c.toUpperCase());

// Teléfono del cliente en formato internacional para wa.me (sin + ni 00); 9 cifras = número español
function telInternacional(){
  let d=S.tel.trim().replace(/[^\d+]/g,'');
  if(d.startsWith('+'))return d.slice(1);
  if(d.startsWith('00'))return d.slice(2);
  return d.length===9?'34'+d:d;
}

// Enlaces para el email del restaurante: abren WhatsApp con el cliente y la respuesta ya escrita, en su idioma
function enlacesRespuesta(){
  const t=T(),n=nombreBonito().split(' ')[0];
  let f=fmtLargo(parse(S.fecha));
  if(t===TXT.es)f=f[0].toLowerCase()+f.slice(1);
  const wa=m=>`https://wa.me/${telInternacional()}?text=${encodeURIComponent(m)}`;
  return{si:wa(t.siMsg(n,f,S.hora,t.pers(S.n))),no:wa(t.noMsg(n,f,S.hora))};
}

// Enlace wa.me con la reserva ya escrita: lo envía el propio cliente desde su WhatsApp
function btnWhatsApp(t,texto,clase='btn-gold'){
  // Sin emojis: algunos WhatsApp (sobre todo de escritorio) los muestran como "�"
  const L=t.waL,nombre=nombreBonito();
  const msg=[
    t.waMsg,
    '',
    `*${L.reserva}:* ${fmtLargo(parse(S.fecha))} ${L.a} ${S.hora}`,
    `*${L.pers}:* ${S.n}`,
    `*${L.nombre}:* ${nombre}`,
    `*${L.tel}:* ${S.tel.trim()}`,
    S.notas.trim()?`*${L.notas}:* ${S.notas.trim()}`:null
  ].filter(l=>l!==null).join('\n');
  return `<a class="btn ${clase} rv-wa" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">`+
    `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.4-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2l-.5-.2z"/></svg>`+
    `<span>${texto}</span></a>`;
}

function render(foco){
  const t=T();
  $('#rvEyebrow').textContent=t.eyebrow;
  $('.rv-x').setAttribute('aria-label',t.close);
  const prog=$('#rvProg'),body=$('#rvBody'),ft=$('#rvFt');
  if(S.enviado){
    $('#rvTitle').textContent=t.okT;
    prog.hidden=true;
    body.innerHTML=`<div class="rv-ok"><span class="rv-ok-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><p>${t.okP}</p>`+
      `<div class="rv-wa-box">${btnWhatsApp(t,t.waBtn)}<small>${t.waHint}</small></div></div>`+resumen(t);
    ft.innerHTML=`<button type="button" class="btn btn-line rv-end" data-act="close">${t.close}</button>`;
  }else{
    $('#rvTitle').textContent=t.q[S.step];
    prog.hidden=false;
    prog.innerHTML=t.steps.map((s,i)=>`<li class="${i<S.step?'done':i===S.step?'on':''}"${i===S.step?' aria-current="step"':''}><span>${pad(i+1)}</span><b>${s}</b></li>`).join('');
    body.innerHTML=[pPersonas,pFecha,pHora,pDatos,pResumen][S.step](t);
    const listo=[S.n,S.fecha,S.hora,true][S.step];
    const atras=S.step?`<button type="button" class="btn btn-line" data-act="back">${t.back}</button>`:'';
    const sig=S.step<4
      ?`<button type="button" class="btn btn-gold" data-act="next"${listo?'':' disabled'}>${t.cont}</button>`
      :`<button type="button" class="btn btn-gold" data-act="send"${S.enviando?' disabled':''}>${S.enviando?t.sending:t.confirm}</button>`;
    ft.innerHTML=atras+sig;
  }
  body.scrollTop=0;
  if(foco===true)$('#rvTitle').focus();
  else if(foco)$(foco)?.focus();
}

function ir(i){S.step=i;render(true);}

function validar(){
  const t=T(),e={};
  const tl=S.tel.replace(/[\s.\-()]/g,'');
  if(!S.nombre.trim())e.nombre=t.err.req;
  if(!tl)e.tel=t.err.req;else if(!/^\+?\d{9,15}$/.test(tl))e.tel=t.err.tel;
  if(!S.email.trim())e.email=t.err.req;else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.email.trim()))e.email=t.err.email;
  if(!S.rgpd)e.rgpd=t.err.rgpd;
  S.errores=e;
  return Object.keys(e)[0];
}

function siguiente(){
  if(S.step<3){ir(S.step+1);return;}
  const malo=validar();
  if(malo)render(`[name="${malo}"]`);else ir(4);
}

async function enviar(){
  if(S.enviando)return;
  S.enviando=true;S.fallo=false;render('[data-act="send"]');
  const fecha=fmtLargo(parse(S.fecha),'es-ES');
  const resp=enlacesRespuesta();
  const datos={
    access_key:CONFIG.web3formsKey,
    subject:`Nueva reserva · ${fecha} · ${S.hora} · ${S.n} pers. · ${S.nombre.trim()}`,
    from_name:'Web Home Sushi',
    replyto:S.email.trim(),
    'Nombre':S.nombre.trim(),
    'Teléfono':S.tel.trim(),
    'Email':S.email.trim(),
    'Personas':S.n,
    'Fecha':fecha,
    'Hora':`${S.hora} (${TXT.es.turnos[S.turno]})`,
    'Comentarios':S.notas.trim()||'—',
    'Idioma':document.documentElement.lang==='en'?'Inglés':'Español',
    '✅ CONFIRMAR por WhatsApp (pulsa y envía)':resp.si,
    '❌ NO HAY MESA por WhatsApp (pulsa y envía)':resp.no,
    botcheck:S.botcheck
  };
  try{
    let ok;
    if(!CONFIG.web3formsKey){
      // Sin clave solo se simula el envío al probar en local
      if(!/^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname))throw new Error('Falta la clave de Web3Forms en CONFIG');
      console.warn('[reservas] Sin clave de Web3Forms: envío simulado',datos);
      await new Promise(r=>setTimeout(r,700));
      ok=true;
    }else{
      const r=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(datos)});
      const j=await r.json().catch(()=>({}));
      ok=r.ok&&j.success;
    }
    if(!ok)throw new Error('Web3Forms rechazó el envío');
    S.enviado=true;
  }catch(err){
    console.error('[reservas]',err);
    S.fallo=true;
  }
  S.enviando=false;
  render(true);
}

/* ===== Eventos ===== */
let origen=null;
function abrir(btn){
  origen=btn;
  if(S.enviado)S={...VACIO};
  sanear();
  document.getElementById('nav')?.classList.remove('open');
  document.documentElement.classList.add('rv-lock');
  dlg.showModal();
  render(true);
}

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-reserva]');
  if(!b||typeof dlg.showModal!=='function')return; // sin <dialog>: el enlace tel: sigue funcionando
  e.preventDefault();
  abrir(b);
});

dlg.addEventListener('close',()=>{
  document.documentElement.classList.remove('rv-lock');
  origen?.focus();
});

dlg.addEventListener('click',e=>{
  if(e.target===dlg){dlg.close();return;} // clic en el fondo
  const b=e.target.closest('button');
  if(!b||b.disabled)return;
  const d=b.dataset;
  if(d.n){S.n=+d.n;ir(1);}
  else if(d.d){
    S.fecha=d.d;
    if(!horas(S.fecha).some(g=>g.horas.includes(S.hora)))S.hora='';
    ir(2);
  }
  else if(d.h){S.hora=d.h;S.turno=d.t;ir(3);}
  else switch(d.act){
    case'close':dlg.close();break;
    case'back':S.fallo=false;ir(S.step-1);break;
    case'next':siguiente();break;
    case'send':enviar();break;
    case'prevm':case'nextm':
      S.mes=new Date(S.mes.getFullYear(),S.mes.getMonth()+(d.act==='nextm'?1:-1),1);
      render(`[data-act="${d.act}"]:not(:disabled), .rv-day:not(:disabled)`);
      break;
  }
});

function campoCambia(e){
  const f=e.target.name;
  if(!f||!(f in VACIO))return;
  S[f]=e.target.type==='checkbox'?e.target.checked:e.target.value;
  if(S.errores[f]){
    delete S.errores[f];
    $('#rvErr-'+f).textContent='';
    e.target.setAttribute('aria-invalid','false');
  }
}
dlg.addEventListener('input',campoCambia);
dlg.addEventListener('change',campoCambia);
dlg.addEventListener('submit',e=>{e.preventDefault();siguiente();});
})();
