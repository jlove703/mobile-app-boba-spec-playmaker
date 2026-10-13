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
 document.addEventListener('click',ev=>{if(!portrait()||ev.target.closest('.mobile-play-preview'))return;const card=ev.target.closest('#battlePlayHand .play-card');if(card&&!state.pendingEffect){if(selectedPlay===card.dataset.cardId){/* original adapter handles second tap */}else{setTimeout(()=>{if(selectedPlay===card.dataset.cardId)openPreview(card)},0)}}},false);
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closePreview()});
 const addHandLabel=()=>{if(!portrait())return;const hand=document.getElementById('battlePlayHand');if(!hand||!hand.parentNode)return;if(!document.getElementById('mobilePlayLabel')){const label=document.createElement('div');label.id='mobilePlayLabel';label.className='mobile-play-label';label.textContent='YOUR PLAY HAND · Swipe to see every card';hand.before(label)}if(!document.getElementById('mobilePlayHelp')){const help=document.createElement('div');help.id='mobilePlayHelp';help.className='mobile-play-help';help.textContent='Each card shows its full effect. Tap to inspect, then choose Run this Play.';hand.after(help)}};
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
 function sortHand(high){if(!portrait()||!window.state)return;const p=state.players[state.active];if(!p?.placementHand?.length)return;
  p.placementHand.sort((a,b)=>high?Number(b.power)-Number(a.power):Number(a.power)-Number(b.power));
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
