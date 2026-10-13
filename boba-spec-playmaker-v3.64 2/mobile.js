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
 // Disable browser double-tap zoom on cards while keeping desktop double-click gameplay.
 document.addEventListener('dblclick',e=>{if(mobile()&&e.target.closest('#battlePlayHand .play-card'))e.preventDefault()},true);
 const update=()=>document.documentElement.classList.toggle('mobile-ui',mobile());update();addEventListener('resize',update,{passive:true});
})();
