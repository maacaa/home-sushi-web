/* Asistente de reservas · Home Sushi Benidorm
   Chatbot sin IA: responde con textos fijos según botones o palabras clave. Usa los datos de reservas.js. */
(()=>{
'use strict';

const R=window.hsReservas;
if(!R)return;
const C=R.config;
const TEL=`<a href="tel:${C.telefono}">${C.telefonoVisible}</a>`;
const WA_VISIBLE=C.whatsapp.replace(/^34/,'').replace(/(\d{3})(\d{2})(\d{2})(\d{2})/,'$1 $2 $3 $4');
const WA=`<a href="https://wa.me/${C.whatsapp}" target="_blank" rel="noopener">WhatsApp (${WA_VISIBLE})</a>`;
const MAPA='https://maps.google.com/maps?q=Calle+Ibiza+9,+03503+Benidorm';
const turno=id=>C.turnos.find(t=>t.id===id);

/* ===== Textos =====
   Cada tema tiene: botón (chip), respuesta y palabras clave (sin tildes, en minúsculas). */
const TXT={
es:{
  titulo:'Asistente de reservas',abrir:'Abrir el asistente de reservas',cerrar:'Cerrar',
  hola:'¡Hola! 👋 Soy el asistente de reservas de Home Sushi. ¿En qué te ayudo?',
  ph:'Escribe tu pregunta…',enviar:'Enviar',
  noEntiendo:`No sé responder a eso, lo siento. Elige uno de los temas de abajo o llámanos al ${TEL}.`,
  temas:{
    reservar:{chip:'Reservar mesa',
      r:()=>`Puedes reservar aquí mismo en un minuto: eliges personas, día y hora, y nos dejas tus datos.<br><button type="button" class="btn btn-gold hc-cta" data-reserva>Reservar mesa</button>`},
    horas:{chip:'Horarios',
      r:()=>`Se puede reservar a mediodía de ${turno('comida').desde} a ${turno('comida').hasta} y por la noche de ${turno('cena').desde} a ${turno('cena').hasta}, cada ${C.intervalo} minutos.<br>Para hoy, con al menos ${C.margen} minutos de antelación, y hasta ${C.diasVista} días vista.<br>El restaurante abre todos los días de 12:00 a 16:00 y de 18:00 a 00:00.`},
    grupos:{chip:'Grupos',
      r:()=>`Online se puede reservar hasta ${R.maxPers()} personas. Si sois más, llámanos al ${TEL} y os buscamos sitio.`},
    confirmar:{chip:'¿Confirmada?',
      r:()=>`Al enviar la reserva queda <b>pendiente</b>. El restaurante te la confirma lo antes posible por WhatsApp, email o teléfono.<br>Si quieres que vaya más rápido, al terminar pulsa «Enviar también por WhatsApp».`},
    cambiar:{chip:'Cambiar o cancelar',
      r:()=>`Para cambiar o cancelar una reserva escríbenos por ${WA} o llámanos al ${TEL}. Dinos tu nombre, el día y la hora.`},
    notas:{chip:'Alergias',
      r:()=>`Indícalo en «Comentarios» al hacer la reserva: alergias o intolerancias, trona para bebés, cumpleaños… Lo tendremos en cuenta al preparar la mesa.`},
    donde:{chip:'Ubicación',
      r:()=>`Estamos en C. Ibiza 9, 03503 Benidorm, junto a la playa de Levante. <a href="${MAPA}" target="_blank" rel="noopener">Cómo llegar →</a>`}
  }},
en:{
  titulo:'Booking assistant',abrir:'Open the booking assistant',cerrar:'Close',
  hola:"Hi! 👋 I'm the Home Sushi booking assistant. How can I help?",
  ph:'Type your question…',enviar:'Send',
  noEntiendo:`Sorry, I can't answer that. Pick one of the topics below or call us on ${TEL}.`,
  temas:{
    reservar:{chip:'Book a table',
      r:()=>`You can book right here in a minute: choose guests, day and time, and leave us your details.<br><button type="button" class="btn btn-gold hc-cta" data-reserva>Book a table</button>`},
    horas:{chip:'Times',
      r:()=>`You can book for lunch from ${turno('comida').desde} to ${turno('comida').hasta} and for dinner from ${turno('cena').desde} to ${turno('cena').hasta}, every ${C.intervalo} minutes.<br>Same-day bookings need at least ${C.margen} minutes' notice, and you can book up to ${C.diasVista} days ahead.<br>We're open every day from 12:00 to 16:00 and from 18:00 to 00:00.`},
    grupos:{chip:'Groups',
      r:()=>`Online bookings are for up to ${R.maxPers()} guests. If there are more of you, call us on ${TEL} and we'll find you a table.`},
    confirmar:{chip:'Confirmed?',
      r:()=>`Once sent, your booking is <b>pending</b>. The restaurant will confirm it as soon as possible by WhatsApp, email or phone.<br>For a faster reply, tap "Also send via WhatsApp" at the end.`},
    cambiar:{chip:'Change or cancel',
      r:()=>`To change or cancel a booking, message us on ${WA} or call us on ${TEL}. Tell us your name, the day and the time.`},
    notas:{chip:'Allergies',
      r:()=>`Add it under "Comments" when you book: allergies or intolerances, a high chair, a birthday… We'll take it into account when setting your table.`},
    donde:{chip:'Location',
      r:()=>`We're at C. Ibiza 9, 03503 Benidorm, next to Levante beach. <a href="${MAPA}" target="_blank" rel="noopener">Get directions →</a>`}
  }}
};

// Palabras clave de ambos idiomas; si varias coinciden, gana el tema con más aciertos (y, si empatan, el primero)
const CLAVES={
  cambiar:['cancel','anul','cambi','modific','mover','change','move','resched'],
  grupos:['grupo','mas de','muchos','somos','group','large','party','people','many'],
  horas:['hora','horario','turno','cuando','abr','abiert','cierr','mediodia','comida','cena','noche','hoy','manana','time','hour','open','close','lunch','dinner','tonight','today','tomorrow','when'],
  confirmar:['confirm','pendiente','recib','llega','respuesta','pending','received','reply'],
  notas:['alerg','intoler','gluten','celiac','vegan','vegetarian','trona','bebe','carrito','cumple','celebr','aniversario','terraza','allerg','high chair','baby','birthday','anniversary','terrace','comment','comentario'],
  donde:['donde','direcc','llegar','ubica','mapa','aparca','parking','calle','where','address','location','directions','map'],
  reservar:['reserv','mesa','book','table','sitio']
};
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
function tema(texto){
  const t=norm(texto);
  let mejor=null,max=0;
  for(const[id,ps]of Object.entries(CLAVES)){
    const n=ps.filter(p=>t.includes(p)).length;
    if(n>max){max=n;mejor=id;}
  }
  return mejor;
}

const L=()=>document.documentElement.lang==='en'?'en':'es';
const T=()=>TXT[L()];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ===== Interfaz ===== */
const raiz=document.createElement('div');
raiz.className='hc';
raiz.innerHTML=`
  <button type="button" class="hc-fab" aria-expanded="false" aria-controls="hcPanel">
    <svg class="hc-ic-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>
    <svg class="hc-ic-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
  <section class="hc-panel" id="hcPanel" role="dialog" aria-labelledby="hcTitle" hidden>
    <header class="hc-hd">
      <div><p class="eyebrow">Home Sushi</p><h2 id="hcTitle"></h2></div>
      <button type="button" class="hc-x" data-act="close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </header>
    <div class="hc-log" id="hcLog" role="log" aria-live="polite"></div>
    <div class="hc-chips" id="hcChips"></div>
    <form class="hc-f" autocomplete="off">
      <input type="text" name="q" maxlength="200">
      <button type="submit" class="hc-send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button>
    </form>
  </section>`;
document.body.appendChild(raiz);
const $=s=>raiz.querySelector(s);
const fab=$('.hc-fab'),panel=$('#hcPanel'),log=$('#hcLog'),chips=$('#hcChips'),input=$('.hc-f input');

function burbuja(html,quien){
  const b=document.createElement('div');
  b.className='hc-msg hc-'+quien;
  b.innerHTML=html;
  log.appendChild(b);
  log.scrollTop=log.scrollHeight;
}

// Respuesta con una pequeña pausa para que se lea como una conversación
function responder(id){
  const t=T();
  setTimeout(()=>{
    burbuja(id?t.temas[id].r():t.noEntiendo,'bot');
  },350);
}

function textos(){
  const t=T();
  $('#hcTitle').textContent=t.titulo;
  $('.hc-x').setAttribute('aria-label',t.cerrar);
  fab.setAttribute('aria-label',t.abrir);
  input.placeholder=t.ph;
  input.setAttribute('aria-label',t.ph);
  $('.hc-send').setAttribute('aria-label',t.enviar);
  chips.innerHTML=Object.entries(t.temas).map(([id,x])=>`<button type="button" class="hc-chip" data-tema="${id}">${x.chip}</button>`).join('');
}
function reiniciar(){
  textos();
  log.innerHTML='';
  burbuja(T().hola,'bot');
}
reiniciar();

function abrir(){
  panel.hidden=false;
  raiz.classList.add('open');
  document.documentElement.classList.add('hc-lock'); // solo bloquea el scroll de la página en el móvil (ver CSS)
  fab.setAttribute('aria-expanded','true');
  log.scrollTop=log.scrollHeight;
  // En el móvil no se enfoca el campo para que no salte el teclado tapando los temas
  if(matchMedia('(hover:hover)').matches)input.focus();
}
function cerrar(volver=true){
  panel.hidden=true;
  raiz.classList.remove('open');
  document.documentElement.classList.remove('hc-lock');
  fab.setAttribute('aria-expanded','false');
  if(volver)fab.focus();
}

fab.addEventListener('click',()=>panel.hidden?abrir():cerrar());
raiz.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)cerrar();});

panel.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b)return;
  if(b.dataset.act==='close')cerrar();
  else if(b.dataset.tema){
    burbuja(esc(b.textContent),'user');
    responder(b.dataset.tema);
  }
  // [data-reserva]: lo abre reservas.js; aquí solo se recoge el chat para dejar sitio al formulario
  else if(b.hasAttribute('data-reserva'))cerrar(false);
});

$('.hc-f').addEventListener('submit',e=>{
  e.preventDefault();
  const q=input.value.trim();
  if(!q)return;
  input.value='';
  burbuja(esc(q),'user');
  responder(tema(q));
});

// Si se cambia el idioma de la página, el asistente empieza de nuevo en ese idioma
new MutationObserver(reiniciar).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
