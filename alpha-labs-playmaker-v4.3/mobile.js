/* Alpha Labs mobile interaction adapter. No game rules or AI overrides. */
(()=>{
 const mq=matchMedia('(pointer: coarse)');
 const mobile=()=>mq.matches||innerWidth<=820;
 let selectedHero=null, selectedPlay=null;
 const clearHero=()=>{document.querySelectorAll('#hand .hero.mobile-selected').forEach(x=>x.classList.remove('mobile-selected'));selectedHero=null};
 const clearPlay=()=>{document.querySelectorAll('#battlePlayHand .play-card.mobile-selected').forEach(x=>x.classList.remove('mobile-selected'));selectedPlay=null};
 function note(s){let el=document.getElementById('mobileHint');if(!el){el=document.createElement('div');el.id='mobileHint';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=s;el.hidden=false;clearTimeout(note.timer);note.timer=setTimeout(()=>el.hidden=true,3500)}
 document.addEventListener('click',e=>{
  if(!mobile())return;
  const hand=e.target.closest('#hand .hero');
  if(hand){const id=hand.dataset.id;if(!id)return;if(selectedHero===id){clearHero();note('Hero deselected.')}else{clearHero();selectedHero=id;hand.classList.add('mobile-selected');note('Tap a battle zone to place this hero.')}return}
  const zone=e.target.closest('#zones .zone');
  if(zone){const index=Number(zone.dataset.zone);if(selectedHero){const id=selectedHero;clearHero();if(typeof moveToZone==='function')moveToZone(id,index)}else{const card=zone.querySelector('.hero');if(card&&typeof state!=='undefined'){const p=state.players[state.active];const found=p.arena[index];if(found){p.arena[index]=null;p.placementHand.push(found);renderPlacement();note('Hero returned to hand.')}}}return}
  const play=e.target.closest('#battlePlayHand .play-card');
  if(play){if(typeof state==='undefined')return;const id=play.dataset.cardId;if(!id)return;if(state.pendingEffect){if(state.pendingEffect.type==='play'&&typeof discardPlayById==='function')discardPlayById(id);return}
   if(selectedPlay===id){clearPlay();if(typeof runPlayCardV34==='function')runPlayCardV34(id)}else{clearPlay();selectedPlay=id;play.classList.add('mobile-selected');note('Tap this Play again to run it, or select another card.')}return}
  const bench=e.target.closest('#battleBench .hero');
  if(bench&&typeof state!=='undefined'&&state.pendingEffect?.type==='hero'&&typeof discardHeroById==='function'){discardHeroById(bench.dataset.id);return}
  if(e.target.closest('#nextPlayerBtn,#battleBtn,#noSubBtn,#confirmSubBtn,#lockBtn')){clearHero();clearPlay()}
 });
 // V2: a full-text inspect view. First tap selects, second tap still runs using original adapter.
 const portrait=()=>mobile()&&matchMedia('(orientation: portrait)').matches;
 let inspectedId=null;
 function closePreview(){const p=document.getElementById('mobilePlayPreview');if(p)p.hidden=true;inspectedId=null}
 function openPreview(card){if(!portrait())return;const id=card.dataset.cardId;if(!id)return;
  let overlay=document.getElementById('mobilePlayPreview');if(!overlay){overlay=document.createElement('div');overlay.id='mobilePlayPreview';overlay.className='mobile-play-preview';overlay.hidden=true;overlay.innerHTML='<div class="mobile-play-preview-panel" role="dialog" aria-modal="true" aria-label="Play details"><div id="mobilePlayPreviewCard"></div><div class="mobile-play-preview-actions"><button type="button" id="mobilePreviewClose">Back to hand</button><button type="button" id="mobilePreviewRun">Run this Play</button></div></div>';document.body.appendChild(overlay);overlay.addEventListener('click',ev=>{if(ev.target===overlay||ev.target.id==='mobilePreviewClose')closePreview()});overlay.querySelector('#mobilePreviewRun').addEventListener('click',()=>{const current=document.querySelector('#battlePlayHand .play-card[data-card-id="'+CSS.escape(inspectedId||'')+'"]');closePreview();if(current)current.click()})}
  const clone=card.cloneNode(true);clone.classList.remove('mobile-selected');clone.removeAttribute('draggable');overlay.querySelector('#mobilePlayPreviewCard').replaceChildren(clone);inspectedId=id;overlay.hidden=false;
 }
 document.addEventListener('click',ev=>{if(!portrait()||ev.target.closest('.mobile-play-preview'))return;const card=ev.target.closest('#battlePlayHand .play-card');if(card&&!state.pendingEffect){if(selectedPlay===card.dataset.cardId){/* original adapter handles second tap */}else{/* V3.2: selected card expands in hand; no automatic modal */}}},false);
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closePreview()});
 const addHandLabel=()=>{if(!portrait())return;const hand=document.getElementById('battlePlayHand');if(!hand||!hand.parentNode)return;if(!document.getElementById('mobilePlayLabel')){const label=document.createElement('div');label.id='mobilePlayLabel';label.className='mobile-play-label';label.textContent='YOUR PLAY HAND';hand.before(label)}};
 new MutationObserver(addHandLabel).observe(document.body,{childList:true,subtree:true});addHandLabel();
 // Disable browser double-tap zoom on cards while keeping desktop double-click gameplay.
 document.addEventListener('dblclick',e=>{if(mobile()&&e.target.closest('#battlePlayHand .play-card'))e.preventDefault()},true);
 const update=()=>document.documentElement.classList.toggle('mobile-ui',mobile());update();addEventListener('resize',update,{passive:true});
})();


/* V3 additions: no changes to game rules, deck logic, or AI decision-making. */
(()=>{
 const portrait=()=>innerWidth<=820&&matchMedia('(orientation:portrait)').matches;
 const $=s=>document.querySelector(s);
 const names=['JLove','DH','Hambeezy'];
 let opponent=null;
 function labelOpponent(){if(!opponent||!window.state?.computerMode)return;
  const set=(sel)=>{const e=$(sel);if(e)e.textContent=e.textContent.replace(/Alpha AI|Scrim AI|Normal AI|Computer|Player 2/g,opponent)};
  ['#p2BattleWrap>span','#battle .dog-strip span:nth-child(2)','#handoffTitle'].forEach(set);
 }
 document.addEventListener('click',e=>{if(e.target.closest('#simpleScrimBtn,#simpleAlphaScrimBtn,#cpuScrimBtn')){opponent=names[Math.floor(Math.random()*names.length)];sessionStorage.setItem('alphaOpponentV3',opponent);setTimeout(labelOpponent,100)}},true);
 opponent=sessionStorage.getItem('alphaOpponentV3');
 function sortHand(high){
  if(!portrait() || typeof state==='undefined' || !state.players)return;
  const player=state.players[state.active];
  if(!player || !Array.isArray(player.arena) || !Array.isArray(player.placementHand))return;
  // Sort all seven actual cards, including those already in Arena slots.
  const cards=[...player.arena.filter(Boolean),...player.placementHand];
  if(cards.length!==7)return;
  cards.sort((a,b)=>high?Number(b.power)-Number(a.power):Number(a.power)-Number(b.power));
  player.arena=cards;
  player.placementHand=[];
  if(typeof renderPlacement==='function')renderPlacement();
 }
 $('#mobileHighLow')?.addEventListener('click',()=>sortHand(true));
 $('#mobileLowHigh')?.addEventListener('click',()=>sortHand(false));
 function tracker(){if(!portrait())return;const el=$('#mobileBattleTracker');if(!el||!window.state)return;const n=Number(state.battle)||1;
  const markup=Array.from({length:7},(_,i)=>`<span class="${i+1===n?'current':''}" aria-label="Battle ${i+1}${i+1===n?' active':''}">${i+1}</span>`).join('');
  if(el.innerHTML!==markup)el.innerHTML=markup;
 }
 let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;tracker();labelOpponent()})}).observe(document.body,{subtree:true,childList:true,characterData:true});
 tracker();labelOpponent();
})();

// V3.1: turn-aware portrait placement, without changing the engine.
(()=>{
 const sync=()=>{
   if(!matchMedia('(max-width:820px) and (orientation:portrait)').matches)return;
   const board=document.querySelector('#battle .battle-board');
   if(!board)return;
   const active=typeof state!=='undefined'?state.active:0;
   board.classList.toggle('mobile-active-p2',active===1);
 };
 new MutationObserver(sync).observe(document.getElementById('battle'),{attributes:true,childList:true,subtree:true,attributeFilter:['class','style','hidden']});
 sync();
})();

/* V3.2 portrait: live bench display and discard shortcuts. */
(()=>{
 const portrait=()=>matchMedia('(max-width:820px) and (orientation:portrait)').matches;
 const dock=document.getElementById('mobileBenchCards');
 let lastSignature='';
 const update=()=>{
  if(!portrait()||!dock||typeof state==='undefined'||!state.players)return;
  const p=state.players[state.active]||state.players[0];
  const heroes=p?.bench||[];
  const sig=state.active+':'+heroes.map(h=>h.id+':'+h.power+':'+h.weapon).join('|');
  if(sig!==lastSignature){
   lastSignature=sig;dock.replaceChildren();
   heroes.forEach(h=>{
    const b=document.createElement('button');b.type='button';b.className='mobile-bench-hero';
    const power=document.createElement('strong');power.textContent=h.power;
    const weapon=document.createElement('small');weapon.textContent=h.weapon||'';
    b.append(power,weapon);
    b.title='Bench hero '+h.power+' '+(h.weapon||'');
    b.addEventListener('click',()=>{
      const original=[...document.querySelectorAll('#battleBench .hero')].find(e=>e.dataset.id===h.id);
      if(original)original.click();
    });
    dock.append(b);
   });
  }
  document.getElementById('mobilePlayDiscardN').textContent=p?.playDiscard?.length??0;
  document.getElementById('mobileHeroDiscardN').textContent=p?.heroDiscard?.length??0;
 };
 document.getElementById('mobilePlayDiscardQuick')?.addEventListener('click',()=>document.getElementById('discardPileBtn')?.click());
 document.getElementById('mobileHeroDiscardQuick')?.addEventListener('click',()=>document.getElementById('heroDiscardBtn')?.click());
 document.addEventListener('click',()=>requestAnimationFrame(update));
 const observer=new MutationObserver(()=>requestAnimationFrame(update));
 observer.observe(document.getElementById('battle'),{subtree:true,childList:true,characterData:true});
 update();
})();

/* V3.3: keep the full play hand in a single, responsive overlapping row. */
(()=>{
 const hand=document.getElementById('battlePlayHand');
 if(!hand)return;
 let queued=false;
 function layout(){
  queued=false;
  const cards=[...hand.children].filter(el=>el.classList.contains('play-card'));
  const n=cards.length;
  if(!n)return;
  // Every card stays full width internally, while its visible portion shrinks as hand grows.
  // Percent-based overlap ensures no horizontal scrolling or second row.
  const visible= n<=4?Math.min(27,100/n):Math.max(8,100/n);
  const cardWidth=n===1?62:n===2?48:n===3?42:39;
  const step=n===1?0:(100-cardWidth)/(n-1);
  hand.style.setProperty('--fan-card-width',cardWidth+'%');
  hand.style.setProperty('--fan-step',step+'%');
  hand.style.setProperty('--fan-count',String(n));
  cards.forEach((card,i)=>{
   card.style.setProperty('--fan-index',String(i));
   card.style.zIndex=card.classList.contains('mobile-selected')?'100':String(i+1);
  });
 }
 function queue(){if(queued)return;queued=true;requestAnimationFrame(layout)}
 new MutationObserver(queue).observe(hand,{childList:true,subtree:false});
 document.addEventListener('click',e=>{if(e.target.closest('#battlePlayHand .play-card'))requestAnimationFrame(layout)},false);
 addEventListener('resize',queue,{passive:true});queue();
})();

/* V4.3: concise status and safe card selection affordances. */
(()=>{
 const tidy=()=>{
  const el=document.querySelector('.cpu-private-zone strong');
  if(el && el.textContent.includes('state.players')){
   const n=(typeof state!=='undefined'&&state.players?.[1]?.playHand?.length)||0;
   el.textContent=`Computer hand · ${n} hidden`;
  }
  const help=document.querySelector('#playPhaseHelp');
  if(help && /drag a Play|double-click a Play|Mobile: tap/i.test(help.textContent))help.textContent='';
  const box=document.querySelector('#battlePlayHand');
  if(box){box.setAttribute('aria-label','Play hand');}
 };
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;tidy()})}).observe(document.getElementById('battle')||document.body,{subtree:true,childList:true,characterData:true});tidy();
})();
