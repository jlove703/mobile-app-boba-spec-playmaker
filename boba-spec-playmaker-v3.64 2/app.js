const state={gameMode:'spec',players:[newPlayer(),newPlayer()],active:0,openingActive:0,handoffMode:'placement',battle:1,subActive:0,subChoices:[null,null],selectedSub:null,scores:[0,0],battleResults:Array(7).fill(null),seriesScores:[0,0],gameNumber:1,seriesTemplates:null,seriesComplete:false,initialFirst:0,pendingSimpleComputer:null};
function newPlayer(){return{heroes:null,plays:null,arena:Array(7).fill(null),placementHand:[],bench:[],playHand:[],hotDogs:10,heroDiscard:[],playDiscard:[],battlePower:null,playsRunThisBattle:0}}
const $=s=>document.querySelector(s);
function parseCSV(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'){if(q&&n==='"'){cell+='"';i++;}else q=!q}else if(c===','&&!q){row.push(cell.trim());cell=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell.trim());cell='';if(row.some(v=>v!==''))rows.push(row);row=[]}else cell+=c}if(cell||row.length){row.push(cell.trim());if(row.some(v=>v!==''))rows.push(row)}return rows}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function uid(prefix='c'){return crypto.randomUUID?crypto.randomUUID():prefix+Math.random().toString(36).slice(2)}
function parseHeroes(text){const allowedWeapons=new Set(['BRAWL','STEEL','FIRE','ICE','GLOW','HEX','ALT','SUPER']);const rows=parseCSV(text);if(rows.length<2)throw Error('Hero CSV needs a header and 60 Heroes.');const h=rows[0].map(norm);const pi=h.findIndex(x=>x==='power'||x.includes('power'));const wi=h.findIndex(x=>x==='weapontype'||x==='weapon'||x.includes('weapon'));const ni=h.findIndex(x=>x==='hero'||x==='heroname'||x==='name'||x.includes('hero'));if(pi<0||wi<0)throw Error('Hero CSV must include Power and Weapon Type columns.');const cards=rows.slice(1).filter(r=>r.some(Boolean)).map((r,i)=>{const power=Number(r[pi]);const weapon=(r[wi]||'').trim().toUpperCase();const hero=ni>=0?(r[ni]||'').trim():'';if(!Number.isFinite(power)||!weapon)throw Error(`Invalid Hero on row ${i+2}.`);if(!allowedWeapons.has(weapon))throw Error(`Invalid Weapon Type "${weapon}" on row ${i+2}. Allowed: Brawl, Steel, Fire, Ice, Glow, Hex, Alt, Super.`);if(power<115||power>160||power%5!==0)throw Error(`Invalid Spec Power ${power} on row ${i+2}. Power must be 115–160 in 5-point increments.`);return{id:uid('h'),power,weapon,hero}});if(cards.length!==60)throw Error(`Hero deck has ${cards.length} Heroes. Spec requires 60.`);const counts={};for(const c of cards){counts[c.power]=(counts[c.power]||0)+1;if(counts[c.power]>6)throw Error(`Too many ${c.power}-Power Heroes. Spec allows no more than 6 at one Power level.`)}const seen=new Set();for(const c of cards){if(!c.hero)continue;const key=norm(c.hero)+'|'+c.weapon+'|'+c.power;if(seen.has(key))throw Error(`Duplicate Hero + Weapon + Power: ${c.hero} • ${c.weapon} • ${c.power}.`);seen.add(key)}return cards}
function parsePlays(text){const rows=parseCSV(text);if(rows.length<2)throw Error('Play CSV needs a header and 30 Plays.');const h=rows[0].map(norm);let ni=h.findIndex(x=>x==='cardname'||x==='name'||x.includes('cardname'));let ai=h.findIndex(x=>x==='ability'||x==='effect'||x.includes('ability'));let ci=h.findIndex(x=>x==='hdcost'||x==='cost'||x.includes('hdcost'));if(ni<0)ni=0;const data=rows.slice(1).filter(r=>r.some(Boolean));if(data.length!==30)throw Error(`Playbook has ${data.length} Plays. Spec requires 30.`);return data.map((r,i)=>({id:uid('p'),name:(r[ni]||`Play ${i+1}`).trim(),ability:ai>=0?(r[ai]||'').trim():'',cost:ci>=0&&r[ci]!==''?Number(r[ci]):null}))}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
const DEMO_HEROES=[{"power":160,"weapon":"GLOW","hero":"Kurse","variation":"","parallel":"Mixtape","set":"Alpha Update","cardNumber":"MIX-75","heroType":"featured"},{"power":160,"weapon":"GLOW","hero":"Too Tall","variation":"Debut","parallel":"Gold Coin Flip","set":"Tecmo Bowl Edition","cardNumber":"GC175","heroType":"featured"},{"power":160,"weapon":"GLOW","hero":"Hambone","variation":"Jack Ham Debut","parallel":"Inspired Ink","set":"Griffey Edition","cardNumber":"JHA-4","heroType":"featured"},{"power":160,"weapon":"GLOW","hero":"Herro","variation":"Tyler Herro Debut","parallel":"Colosseum","set":"Griffey Edition","cardNumber":"CBF-176","heroType":"featured"},{"power":160,"weapon":"GLOW","hero":"Monk","variation":"Debut","parallel":"Logofoil","set":"Tecmo Bowl Edition","cardNumber":"L178","heroType":"featured"},{"power":160,"weapon":"GLOW","hero":"BuckShot","variation":"","parallel":"Green Battlefoil","set":"Alpha Update","cardNumber":"GBF-38","heroType":"featured"},{"power":155,"weapon":"GLOW","hero":"Mr. Irrelevant","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-100","heroType":"Inspired"},{"power":155,"weapon":"GLOW","hero":"Midas","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-64","heroType":"Inspired"},{"power":155,"weapon":"GLOW","hero":"Chosen","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-63","heroType":"Inspired"},{"power":155,"weapon":"GLOW","hero":"LeBoss","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-61","heroType":"Inspired"},{"power":150,"weapon":"GLOW","hero":"Dunker","variation":"John Starks Debut","parallel":"Alpha Battlefoil","set":"Griffey Edition","cardNumber":"ABF-195","heroType":"featured"},{"power":150,"weapon":"GLOW","hero":"Rockstar","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-102","heroType":"Inspired"},{"power":150,"weapon":"GLOW","hero":"Warp","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-68","heroType":"Inspired"},{"power":150,"weapon":"GLOW","hero":"Pantera","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-101","heroType":"Inspired"},{"power":150,"weapon":"GLOW","hero":"Harpoon","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-69","heroType":"Inspired"},{"power":150,"weapon":"GLOW","hero":"Donny Buckets","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-67","heroType":"Inspired"},{"power":145,"weapon":"GLOW","hero":"Merri-Go-Round","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-73","heroType":"Inspired"},{"power":145,"weapon":"GLOW","hero":"Shystep","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-74","heroType":"Inspired"},{"power":145,"weapon":"GLOW","hero":"Mustang","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-70","heroType":"Inspired"},{"power":145,"weapon":"GLOW","hero":"Jaybird","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-71","heroType":"Inspired"},{"power":145,"weapon":"GLOW","hero":"J-Jetts","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-72","heroType":"Inspired"},{"power":145,"weapon":"GUM","hero":"Lumber","variation":"First Edition","parallel":"Bubble Gum","set":"Griffey Edition","cardNumber":"BGBF-55","heroType":"Inspired"},{"power":140,"weapon":"GLOW","hero":"Lightningrod","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-77","heroType":"Inspired"},{"power":140,"weapon":"GLOW","hero":"Sprinkler","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-106","heroType":"Inspired"},{"power":140,"weapon":"GLOW","hero":"Freakshow","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-76","heroType":"Inspired"},{"power":140,"weapon":"GLOW","hero":"PukaDot","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-105","heroType":"Inspired"},{"power":140,"weapon":"GLOW","hero":"McArmyKnife","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-79","heroType":"Inspired"},{"power":140,"weapon":"GLOW","hero":"Big-Z","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-103","heroType":"Inspired"},{"power":155,"weapon":"GLOW","hero":"Bison","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-65","heroType":"Inspired"},{"power":135,"weapon":"GLOW","hero":"Jaybird","variation":"","parallel":"Blizzard","set":"Alpha Update","cardNumber":"BLBF-71","heroType":"Inspired"},{"power":135,"weapon":"GLOW","hero":"Juice","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-87","heroType":"Inspired"},{"power":135,"weapon":"GLOW","hero":"Lawman","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-110","heroType":"Inspired"},{"power":135,"weapon":"GLOW","hero":"Barnacle","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-111","heroType":"Inspired"},{"power":135,"weapon":"GLOW","hero":"Doublecheck","variation":"First Edition","parallel":"Battlefoil","set":"Alpha Edition","cardNumber":"BF-47","heroType":"Inspired"},{"power":135,"weapon":"GLOW","hero":"Taze'em","variation":"First Edition","parallel":"Battlefoil","set":"Alpha Edition","cardNumber":"BF-32","heroType":"Inspired"},{"power":130,"weapon":"GLOW","hero":"Lieutenant","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-91","heroType":"Inspired"},{"power":130,"weapon":"GLOW","hero":"ChetMate","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-89","heroType":"Inspired"},{"power":130,"weapon":"GLOW","hero":"Portalize","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-117","heroType":"Inspired"},{"power":130,"weapon":"GLOW","hero":"Risarcher","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-119","heroType":"Inspired"},{"power":130,"weapon":"GLOW","hero":"Attak","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-88","heroType":"Inspired"},{"power":130,"weapon":"GLOW","hero":"Snowbear","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-92","heroType":"Inspired"},{"power":125,"weapon":"GLOW","hero":"Simon Says","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-99","heroType":"Inspired"},{"power":125,"weapon":"GLOW","hero":"McArmyKnife","variation":"","parallel":"Mixtape","set":"Alpha Update","cardNumber":"MIX-289","heroType":"Inspired"},{"power":125,"weapon":"GLOW","hero":"Librarian","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-94","heroType":"Inspired"},{"power":125,"weapon":"GLOW","hero":"Boltage","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-93","heroType":"Inspired"},{"power":120,"weapon":"GLOW","hero":"Jeanetic","variation":"Tecmo Bowl","parallel":"Battlefoil","set":"Tecmo Bowl Edition","cardNumber":"BF90","heroType":"inspired"},{"power":120,"weapon":"GLOW","hero":"Exterminaber","variation":"","parallel":"Mixtape","set":"Alpha Update","cardNumber":"MIX-295","heroType":"Inspired"},{"power":120,"weapon":"GLOW","hero":"Attak","variation":"","parallel":"Blizzard","set":"Alpha Update","cardNumber":"BLBF-88","heroType":"Inspired"},{"power":120,"weapon":"GLOW","hero":"Eagle-Eye","variation":"First Edition","parallel":"Battlefoil","set":"Alpha Edition","cardNumber":"BF-107","heroType":"Inspired"},{"power":120,"weapon":"GLOW","hero":"McVillain","variation":"First Edition","parallel":"Battlefoil","set":"Tecmo Bowl Edition","cardNumber":"BF87","heroType":"inspired"},{"power":120,"weapon":"GLOW","hero":"Youngblood","variation":"First Edition","parallel":"Battlefoil","set":"Tecmo Bowl Edition","cardNumber":"BF85","heroType":"inspired"},{"power":115,"weapon":"GLOW","hero":"Mr. Irrelevant","variation":"Tecmo Bowl","parallel":"Silver Coin Flip","set":"Tecmo Bowl Edition","cardNumber":"SC239","heroType":"inspired"},{"power":115,"weapon":"GLOW","hero":"Vampire","variation":"First Edition","parallel":"Blizzard","set":"Alpha Edition","cardNumber":"BLBF-132","heroType":"Inspired"},{"power":115,"weapon":"GLOW","hero":"Shepherd","variation":"Tecmo Bowl","parallel":"Alpha Battlefoil","set":"Tecmo Bowl Edition","cardNumber":"ABF-241","heroType":"inspired"},{"power":115,"weapon":"GLOW","hero":"Sabotage","variation":"","parallel":"Blizzard","set":"Alpha Update","cardNumber":"BLBF-96","heroType":"Inspired"},{"power":115,"weapon":"GLOW","hero":"Lieutenant","variation":"","parallel":"Mixtape","set":"Alpha Update","cardNumber":"MIX-301","heroType":"Inspired"},{"power":115,"weapon":"GLOW","hero":"Chanesaw","variation":"First Edition","parallel":"Silver Coin Flip","set":"Tecmo Bowl Edition","cardNumber":"SC238","heroType":"inspired"},{"power":155,"weapon":"GLOW","hero":"Merlomes","variation":"","parallel":"Battlefoil","set":"Alpha Update","cardNumber":"BF-62","heroType":"Inspired"},{"power":125,"weapon":"GLOW","hero":"BrockNess","variation":"First Edition","parallel":"Battlefoil","set":"Griffey Edition","cardNumber":"BF-79","heroType":"Inspired"},{"power":125,"weapon":"GLOW","hero":"Yeti","variation":"Tecmo Bowl","parallel":"Battlefoil","set":"Tecmo Bowl Edition","cardNumber":"BF81","heroType":"inspired"}];
const DEMO_PLAYS=[{"name":"Reload","ability":"Pick up 1 Play you used in a previous Battle and add it back to your Hand.","cost":1,"dbs":80},{"name":"Sacrifice And Scheme","ability":"Draw 2 Plays and Discard 2 Heroes.","cost":1,"dbs":45},{"name":"Overflow Tax","ability":"Recover 3 Hot Dogs. If you have more Hot Dogs than your opponent after you've recovered your Hot Dogs, Discard 1 Play.","cost":0,"dbs":39},{"name":"Dog Gone Flip","ability":"Flip a coin. If heads, you Recover 3 Hot Dogs. If tails, your opponent Recovers 3 Hot Dogs.","cost":0,"dbs":12},{"name":"10 Per Play","ability":"Your Hero gets +10 for every other Play you have used so far in this Battle.","cost":1,"dbs":41},{"name":"Fallen Fighters","ability":"Discard 1 Hero from your hand. Your current Hero gets +10 for every Hero in your Discard Pile with the same weapon type as the one you discarded.","cost":1,"dbs":21},{"name":"Updog","ability":"Whichever player has fewer Hot Dogs Recovers 2 Hot Dogs and draws 1 Play.","cost":0,"dbs":43},{"name":"Steel Crew","ability":"For every Hero with a Steel weapon you've used in all Battles so far, your Hero gets +10.","cost":2,"dbs":19},{"name":"Locker Room Evacuation","ability":"Reveal the top 5 Heroes from your Hero Deck. Add one to your hand and Discard the rest.","cost":1,"dbs":35},{"name":"Deadline Deal","ability":"Swap your Hero's current power with your opponent's current power in this Battle.","cost":3,"dbs":24},{"name":"Dog Gone Inflation","ability":"Your opponent's Plays each cost an extra 2 Hot Dogs for this Battle and the next Battle.","cost":1,"dbs":95},{"name":"Steel Defense","ability":"If your Hero has a Steel weapon, your opponent can't run any Plays this Battle.","cost":1,"dbs":105},{"name":"Deep In The Playbook","ability":"For the rest of the Game, whenever a Player rolls a dice, they get to draw a Play from their Playbook.","cost":0,"dbs":70},{"name":"QB Sneak","ability":"If this Battle is tied, your Hero gets +1.","cost":1,"dbs":9},{"name":"Cheap Addition","ability":"Reveal the top 5 Plays of your Playbook. Add one to your hand and shuffle the rest back into your Playbook.","cost":1,"dbs":42},{"name":"Nasty Or Nada","ability":"Roll a dice 3 times. Your Hero gets +30 if you roll a 6.","cost":1,"dbs":16},{"name":"Worth The Risk?","ability":"Roll a dice: if you get a 1 or 6, your Hero's power drops to 0. If you roll a 2-5, you gain +25.","cost":1,"dbs":16},{"name":"Unified Front","ability":"Your Hero gets +15. If all of your currently revealed Heroes have the same weapon type, this Play costs 0.","cost":2,"dbs":17},{"name":"Line Drive","ability":"Roll a dice. If it lands on 3 or 4, your Hero gets +40. If not, it gets +5.","cost":1,"dbs":22},{"name":"Discarded Heroes","ability":"Your Hero gets +10 for each Hero in your Discard Pile. (Ex: 3 Heroes = +30)","cost":1,"dbs":25},{"name":"Grilled Bandit","ability":"For the rest of the game, if your opponent would recover Hot Dogs, you recover them instead.","cost":5,"dbs":44},{"name":"By Any Means Necessary","ability":"Search your Playbook and run any play for free. (Then, re-shuffle your Playbook.)","cost":6,"dbs":21},{"name":"Luck Of The Draw","ability":"Both players roll a dice; whoever rolls the highest number gets to play the top card from their Playbook for free if able.","cost":0,"dbs":10},{"name":"Pick On Someone Your Own Size","ability":"Your Hero now has the same power as your Opponent's Hero's current power.","cost":2,"dbs":8},{"name":"Ha! Gotcha","ability":"Any Plays currently affecting your Hero's power now also affect your opponent's Hero in this Battle.","cost":1,"dbs":7},{"name":"Quick Draw","ability":"If you run this Play before Battle 3, Draw 2 Plays. If not, Draw 1 Play.","cost":1,"dbs":45},{"name":"Lucky 7","ability":"Roll a die two times; if the numbers add up to 7 your Hero gets +100; if any other number you must Discard a random Hero from your hand.","cost":0,"dbs":10},{"name":"Weapon Lineage","ability":"Your current Hero gets +10 for every Hero in your Discard Pile with the same weapon type.","cost":1,"dbs":25},{"name":"Rebuild","ability":"If you lost the previous Battle, Discard all Heroes in your hand and draw 4 new Heroes from your Hero Deck.","cost":2,"dbs":7},{"name":"Back From The Dumps","ability":"Each player gets up to 3 Hot Dogs back from their Discard Pile.","cost":0,"dbs":44}];
function demoHeroes(){return DEMO_HEROES.map(c=>({...c,id:uid('demo-h')}))}
function demoPlays(){return DEMO_PLAYS.map(c=>({...c,id:uid('demo-p')}))}
async function loadFile(input,kind,p){if(!input.files[0])return;try{const text=await input.files[0].text();state.players[p][kind]=kind==='heroes'?parseHeroes(text):parsePlays(text);updateSetup()}catch(e){state.players[p][kind]=null;$('#setupError').textContent=e.message;updateSetup()}}
function updateSetup(){for(let p=0;p<2;p++){const pl=state.players[p],bits=[];if(pl.heroes)bits.push('60 Heroes ✓');if(pl.plays)bits.push('30 Plays ✓');const el=$(`#p${p+1}Status`);el.textContent=bits.length?bits.join(' • '):'Waiting for files';el.className='status '+(bits.length===2?'good':'')}const ok=state.players.every(p=>p.heroes&&p.plays);$('#startBtn').disabled=!ok;if(ok)$('#setupError').textContent=''}
['Heroes','Plays'].forEach(kind=>[0,1].forEach(p=>$(`#p${p+1}${kind}`).addEventListener('change',e=>loadFile(e.target,kind.toLowerCase(),p))));
$('#demoBtn').addEventListener('click',()=>{state.players[0].heroes=demoHeroes();state.players[0].plays=((window.PLAY_PRESETS||{})['Glow Deck']||DEMO_PLAYS).map(c=>({...c,id:uid('demo-p')}));state.players[1].heroes=demoHeroes();state.players[1].plays=((window.PLAY_PRESETS||{})['Glow Deck']||DEMO_PLAYS).map(c=>({...c,id:uid('demo-p')}));updateSetup()});
function cloneDeck(cards,type){return (cards||[]).map(c=>({...c,id:uid(type==='hero'?'h':'p')}))}
function captureSeriesTemplates(){state.seriesTemplates=state.players.map(p=>({heroes:cloneDeck(p.heroes,'hero'),plays:cloneDeck(p.plays,'play')}));}
function resetPlayerForGame(i){const t=state.seriesTemplates[i],p=newPlayer();p.heroes=shuffle(cloneDeck(t.heroes,'hero'));p.plays=shuffle(cloneDeck(t.plays,'play'));p.effects={inflationThrough:0,discountThrough:0,blockedBattle:0,grilledBandit:false,qbSneakBattle:0,permanentPowerBonus:0,makeUpCallBattle:0,consolationBattle:0,steelMarchStart:0,steelMarchThrough:0,delayedRecoveryBattle:0,lassoBattle:0,restrictedBattle:0,restrictedBy:null,nextPowerBattle:0,nextPowerAmount:0,highStakesBattle:0,rollingReset:false,easyChoiceBattle:0,easyChoiceHonors:null,firstPlayFreeBattle:0};p.dogsSpentThisBattle=0;p.playHistory=[];p.playedStacks=Array.from({length:7},()=>[]);p.placementHand=p.heroes.splice(0,7);state.players[i]=p;}
function beginSeriesGame(){state.scores=[0,0];state.battleResults=Array(7).fill(null);state.battle=1;state.pendingEffect=null;state.deepPlaybook=false;state.honors=state.initialFirst??0;state.turnOrder=[state.honors,1-state.honors];state.seriesComplete=false;resetPlayerForGame(0);resetPlayerForGame(1);state.active=0;state.openingActive=0;state.handoffMode='placement';updateSeriesScoreboard();show('placement');renderPlacement();}
$('#startBtn').addEventListener('click',()=>{if(!state.seriesTemplates){captureSeriesTemplates();state.seriesScores=[0,0];state.gameNumber=1;}beginSeriesGame()});
function show(id){const target=$('#'+id);if(!target){console.error('Unknown screen:',id);return}document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));target.classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function heroEl(card){const el=document.createElement('div');el.className='hero';el.draggable=true;el.dataset.id=card.id;el.innerHTML=`<div class="power">${card.power}</div>${card.mvfree?'<div class="mvfree-tag">(MVFree)</div>':''}<div class="weapon">${escapeHTML(card.weapon)}</div>`;el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',card.id));return el}
function escapeHTML(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function findCard(id){const p=state.players[state.active];let idx=p.placementHand.findIndex(c=>c.id===id);if(idx>=0)return{card:p.placementHand[idx],from:'hand',idx};idx=p.arena.findIndex(c=>c&&c.id===id);if(idx>=0)return{card:p.arena[idx],from:'arena',idx};return null}
function moveToZone(id,z){const p=state.players[state.active],found=findCard(id);if(!found)return;const existing=p.arena[z];if(found.from==='hand')p.placementHand.splice(found.idx,1);else p.arena[found.idx]=null;if(existing)p.placementHand.push(existing);p.arena[z]=found.card;renderPlacement()}
function renderPlacement(){const p=state.players[state.active];$('#turnLabel').textContent=`Player ${state.active+1}`;$('#deckCount').textContent=p.heroes.length;const zones=$('#zones');zones.innerHTML='';for(let i=0;i<7;i++){const z=document.createElement('div');z.className='zone';z.dataset.zone=i;z.innerHTML=`<div class="zone-label">BATTLE ${i+1}</div>`;z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('dragover')});z.addEventListener('dragleave',()=>z.classList.remove('dragover'));z.addEventListener('drop',e=>{e.preventDefault();z.classList.remove('dragover');moveToZone(e.dataTransfer.getData('text/plain'),i)});if(p.arena[i])z.appendChild(heroEl(p.arena[i]));zones.appendChild(z)}const hand=$('#hand');hand.innerHTML='';p.placementHand.forEach(c=>{const e=heroEl(c);e.title='Drag to a Battle slot or double-click to place in the next open slot';e.addEventListener('dblclick',ev=>{ev.preventDefault();const next=p.arena.findIndex(x=>!x);if(next>=0)moveToZone(c.id,next)});hand.appendChild(e)});hand.ondragover=e=>e.preventDefault();hand.ondrop=e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');const found=findCard(id);if(found&&found.from==='arena'){p.arena[found.idx]=null;p.placementHand.push(found.card);renderPlacement()}};const placed=p.arena.filter(Boolean).length;$('#lockBtn').textContent=`Lock Arena (${placed}/7)`;$('#lockBtn').disabled=placed!==7}
$('#resetPlacement').addEventListener('click',()=>{const p=state.players[state.active];p.placementHand.push(...p.arena.filter(Boolean));p.arena=Array(7).fill(null);renderPlacement()});
$('#lockBtn').addEventListener('click',()=>{if(state.active===0){state.active=1;state.handoffMode='placement';$('#handoffTitle').textContent='Player 2';$('#handoffText').textContent="Player 1's Arena is locked. Pass the device to Player 2 before continuing.";$('#handoffBtn').textContent="I'm Player 2 • Continue";show('handoff')}else{dealOpeningHands();state.openingActive=0;state.handoffMode='opening';$('#handoffTitle').textContent='Player 1';$('#handoffText').textContent='Both Arenas are locked. Pass the device to Player 1 to privately view the opening Bench and Play hand.';$('#handoffBtn').textContent="I'm Player 1 • Show My Hand";show('handoff')}});
$('#handoffBtn').addEventListener('click',()=>{if(state.handoffMode==='placement'){show('placement');renderPlacement()}else{show('openingHand');renderOpening()}});
function dealOpeningHands(){state.players.forEach(p=>{p.bench=p.heroes.splice(0,4);p.playHand=p.plays.splice(0,4)})}
function playEl(card){const el=document.createElement('article');el.className='play-card';el.dataset.cardId=card.id;const cost=Number.isFinite(card.cost)?card.cost:'?';el.innerHTML=`<div class="play-top"><strong>${escapeHTML(card.name)}</strong><span class="cost">${cost}<small>HD</small></span></div><div class="play-effect">${escapeHTML(card.ability||'Play effect')}</div><div class="play-footer">PLAY</div>`;return el}
function fitPlayCard(el){if(!el||!el.isConnected)return;const effect=el.querySelector('.play-effect'),title=el.querySelector('.play-top strong');if(!effect||!title)return;let fs=parseFloat(getComputedStyle(effect).fontSize)||10,ts=parseFloat(getComputedStyle(title).fontSize)||11;while(el.scrollHeight>el.clientHeight&&fs>6){fs-=.35;effect.style.fontSize=fs+'px'}while(el.scrollHeight>el.clientHeight&&ts>6.5){ts-=.35;title.style.fontSize=ts+'px'}if(el.scrollHeight>el.clientHeight){effect.style.lineHeight='1.02';effect.style.padding='1px 0'}}
function renderOpening(){const p=state.players[state.openingActive];$('#openingPlayer').textContent=`Player ${state.openingActive+1}`;$('#openingHeroCount').textContent=p.heroes.length;$('#openingPlayCount').textContent=p.plays.length;const bench=$('#bench');bench.innerHTML='';p.bench.forEach(c=>bench.appendChild(heroEl(c)));bench.querySelectorAll('.hero').forEach(h=>h.draggable=false);const hand=$('#playHand');hand.innerHTML='';p.playHand.forEach(c=>hand.appendChild(playEl(c)));$('#openingDone').textContent=state.openingActive===0?"I've Seen My Hand • Pass to Player 2":"I've Seen My Hand • Finish Setup"}
$('#openingDone').addEventListener('click',()=>{if(state.openingActive===0){state.openingActive=1;state.handoffMode='opening';$('#handoffTitle').textContent='Player 2';$('#handoffText').textContent="Player 1's private opening hand is hidden. Pass the device to Player 2.";$('#handoffBtn').textContent="I'm Player 2 • Show My Hand";show('handoff')}else show('ready')});
$('#restartBtn').addEventListener('click',()=>location.reload());

$('#battleBtn').addEventListener('click',()=>startBattle(1));
function startBattle(n){state.battle=n;state.turnOrder=[state.honors,1-state.honors];const nb=$('#nextPlayerBtn');if(nb){nb.dataset.mode='';nb.disabled=false;nb.textContent=`Pass to Player ${state.turnOrder[1]+1}`};state.players.forEach(p=>{p.battlePower=null;p.playsRunThisBattle=0;p.dogsSpentThisBattle=0});state.subActive=state.turnOrder[0];state.subChoices=[null,null];state.selectedSub=null;show('battle');renderBattle();}
function renderScoreboard(){const box=$('#scoreRows');box.innerHTML='';for(let i=0;i<7;i++){const r=document.createElement('div');const result=state.battleResults[i],active=i===state.battle-1;const p1=active&&state.players[0].battlePower!=null?state.players[0].battlePower:(result===0?'✓':'');const p2=active&&state.players[1].battlePower!=null?state.players[1].battlePower:(result===1?'✓':'');r.className='score-row '+(active?'active ':i>state.battle-1?'future ':'');r.innerHTML=`<span class="battle-num">${active?'● ':''}Battle ${i+1}</span><span class="power-score">${p1}</span><span class="power-score">${p2}</span>`;box.appendChild(r)}$('#p1Score').textContent=state.scores[0];$('#p2Score').textContent=state.scores[1]}
function updateSeriesScoreboard(){const a=$('#seriesP1'),b=$('#seriesP2'),g=$('#seriesGame');if(a)a.textContent=state.seriesScores[0];if(b)b.textContent=state.seriesScores[1];if(g)g.textContent=`Game ${state.gameNumber} of 3`;}
function renderBattle(){renderPlayedStacks();const p=state.players[state.subActive];$('#battleTitle').textContent=`Battle ${state.battle}`;$('#p1Dogs').textContent=state.players[0].hotDogs;$('#p2Dogs').textContent=state.players[1].hotDogs;renderScoreboard();renderActiveHeroes(false);const panel=$('#subPanel');panel.style.display='grid';$('#phaseText').textContent='Substitution Phase';$('#subPrompt').textContent=`Player ${state.subActive+1}: Substitute Battle ${state.battle} Hero?`;$('#subHelp').textContent=`A substitution costs 2 Hot Dogs. You have ${p.hotDogs} Hot Dogs. Your Arena Hero stays face-down until both players decide.`;const bench=$('#subBench');bench.innerHTML='';p.bench.forEach((c,i)=>{const el=heroEl(c);el.draggable=false;el.addEventListener('click',()=>{state.selectedSub=i;renderBattle()});if(state.selectedSub===i)el.classList.add('selected');bench.appendChild(el)});$('#confirmSubBtn').disabled=state.selectedSub===null||p.hotDogs<2;$('#battleMessage').textContent='';}
function renderActiveHeroes(reveal){for(let i=0;i<2;i++){const card=state.players[i].arena[state.battle-1];const el=$(`#p${i+1}ActiveHero`);if(!reveal){el.className='face-down';el.innerHTML='?'}else{el.className='revealed-hero';el.innerHTML=`<strong>${card.power}</strong><span class="hero-name">${escapeHTML(card.hero||'Hero')}</span><span>${escapeHTML(card.weapon)}</span>`}}}
function finishSubDecision(didSub){const p=state.players[state.subActive];if(didSub){const payer=(p.effects?.opponentPaysSubBattle===state.battle)?state.players[1-state.subActive]:p;if(state.selectedSub===null||payer.hotDogs<2)return;const incoming=p.bench[state.selectedSub];const outgoing=p.arena[state.battle-1];payer.hotDogs-=2;payer.dogsSpentThisBattle=(payer.dogsSpentThisBattle||0)+2;if(p.effects?.opponentPaysSubBattle===state.battle)p.effects.opponentPaysSubBattle=0;p.heroDiscard.push(outgoing);p.arena[state.battle-1]=incoming;p.bench.splice(state.selectedSub,1);if(p.heroes.length)p.bench.push(p.heroes.shift());state.subChoices[state.subActive]='sub'}else state.subChoices[state.subActive]='pass';state.selectedSub=null;const first=state.turnOrder[0],second=state.turnOrder[1];if(state.subActive===first){state.subActive=second;showBattleHandoff()}else finishBothSubs()}
function showBattleHandoff(){const first=state.turnOrder[0],second=state.turnOrder[1];$('#subPanel').style.display='none';$('#battleMessage').innerHTML=`<strong>Player ${first+1} decision locked.</strong> Pass the screen to Player ${second+1}, then click below.<br><button id="p2SubContinue" class="primary">I’m Player ${second+1} • Continue</button>`;$('#p2SubContinue').addEventListener('click',()=>renderBattle())}
function finishBothSubs(){state.players.forEach((p,i)=>{p.battlePower=Number(p.arena[state.battle-1].power)+(p.effects?.permanentPowerBonus||0);if(p.effects?.steelMarchStart&&state.battle>=p.effects.steelMarchStart&&state.battle<=p.effects.steelMarchThrough&&p.arena[state.battle-1]?.weapon==='STEEL')p.battlePower+=10;if(p.effects?.delayedRecoveryBattle===state.battle){p.battlePower=Math.max(0,p.battlePower-10);recoverDogs(i,2);p.effects.delayedRecoveryBattle=0;}if(p.effects?.nextPowerBattle===state.battle){p.battlePower=Math.max(0,p.battlePower+(p.effects.nextPowerAmount||0));p.effects.nextPowerBattle=0;p.effects.nextPowerAmount=0;}});renderActiveHeroes(true);$('#subPanel').style.display='none';$('#p1Dogs').textContent=state.players[0].hotDogs;$('#p2Dogs').textContent=state.players[1].hotDogs;$('#phaseText').textContent='Play Phase';const notes=state.subChoices.map((x,i)=>`P${i+1}: ${x==='sub'?'Substituted • 2 🌭 spent • Bench refilled':'No substitution'}`).join(' &nbsp; | &nbsp; ');$('#battleMessage').innerHTML=`${notes}<br><strong>Heroes revealed. Drag a Play onto your Hero.</strong>`;startPlayPhase(state.honors)}
$('#noSubBtn').addEventListener('click',()=>finishSubDecision(false));
$('#confirmSubBtn').addEventListener('click',()=>finishSubDecision(true));

// Combined Alpha Update + 2024 Alpha Edition + 2026 checklist Spec deck generator
const SPEC_WEAPONS=['BRAWL','STEEL','FIRE','ICE','GLOW','HEX','ALT','SUPER'];
const SPEC_POWERS=[115,120,125,130,135,140,145,150,155,160];
function uniqueEligible(weapon,power){const seen=new Set();return (window.HERO_MASTER||[]).filter(c=>c.weapon===weapon&&c.power===power).filter(c=>{const k=norm(c.hero)+'|'+c.weapon+'|'+c.power;if(seen.has(k))return false;seen.add(k);return true})}
function weaponEligibility(w){const byPower={};let ok=true;for(const p of SPEC_POWERS){byPower[p]=uniqueEligible(w,p).length;if(byPower[p]<6)ok=false}return{ok,byPower}}
function initGenerator(){const sel=$('#genWeapon');if(!sel)return;sel.innerHTML='';for(const w of SPEC_WEAPONS){const e=weaponEligibility(w),o=document.createElement('option');o.value=w;o.textContent=`${w} ${e.ok?'✓':'— not enough eligible Heroes'}`;sel.appendChild(o)}renderGeneratorStatus()}
function renderGeneratorStatus(){const w=$('#genWeapon').value,e=weaponEligibility(w),st=$('#generatorStatus');const shortages=SPEC_POWERS.filter(p=>e.byPower[p]<6);if(e.ok){st.className='status generator-good';st.textContent=`${w} can generate a legal 60-Hero mono-weapon Spec deck.`}else{st.className='status generator-warning';st.textContent=`${w} cannot currently make a full legal mono-weapon deck from this checklist. Short at: ${shortages.map(p=>p+' ('+e.byPower[p]+'/6)').join(', ')}.`}$('#generateDeckBtn').disabled=!e.ok;$('#generatedPreview').classList.remove('show')}
function generateSpecDeck(){const w=$('#genWeapon').value,pidx=Number($('#genPlayer').value),e=weaponEligibility(w);if(!e.ok)return;let deck=[];for(const power of SPEC_POWERS){const pool=shuffle(uniqueEligible(w,power));deck.push(...pool.slice(0,6).map(c=>({id:uid('g'),power:c.power,weapon:c.weapon,hero:c.hero,variation:c.variation,treatment:c.treatment,cardNumber:c.cardNumber,inspiredBy:c.inspiredBy})))}state.players[pidx].heroes=shuffle(deck);updateSetup();const prev=$('#generatedPreview');prev.classList.add('show');prev.innerHTML=`<strong>Player ${pidx+1}: ${w} deck generated.</strong><div class="power-summary">${SPEC_POWERS.map(p=>`<span class="power-chip">${p}: 6</span>`).join('')}</div><div class="status generator-good">60 Heroes ready • Rerun Generate to randomize the selections again.</div>`}
function loadPresetPlayDeck(){const pidx=Number($('#genPlayer').value),name=$('#genPlayDeck').value,src=(window.PLAY_PRESETS||{})[name];if(!src)return;state.players[pidx].plays=src.map(c=>({...c,id:uid('preset-p')}));updateSetup();const prev=$('#generatedPreview');prev.classList.add('show');prev.innerHTML=`<strong>Player ${pidx+1}: ${escapeHTML(name)} loaded.</strong><div class="status generator-good">30 preset Plays ready.</div>`}
$('#loadPresetBtn')?.addEventListener('click',loadPresetPlayDeck);
$('#genWeapon')?.addEventListener('change',renderGeneratorStatus);
$('#generateDeckBtn')?.addEventListener('click',generateSpecDeck);
initGenerator();


function positionBattleHeroes(){const pct=10.92+(state.battle-1)*11.13;const active=state.active,other=1-active;const aw=$(`#p${active+1}BattleWrap`),ow=$(`#p${other+1}BattleWrap`);aw.style.left=pct+'%';ow.style.left=pct+'%';aw.classList.add('turn-main-hero');aw.classList.remove('turn-opponent-hero');ow.classList.add('turn-opponent-hero');ow.classList.remove('turn-main-hero');aw.style.zIndex='6';ow.style.zIndex='5'}
function startPlayPhase(playerIndex){state.active=playerIndex;positionBattleHeroes();$('#playPhaseHelp').hidden=false;$('#battleBenchPanel').hidden=false;renderBattleBench();renderBattlePlayHand();renderActiveHeroes(true);renderScoreboard();setupHeroDrop()}
function renderBattleBench(){const box=$('#battleBench');box.innerHTML='';state.players[state.active].bench.forEach(c=>{const e=heroEl(c);e.draggable=false;box.appendChild(e)})}
function renderBattlePlayHand(){const box=$('#battlePlayHand');box.innerHTML='';state.players[state.active].playHand.forEach(c=>{const e=playEl(c);e.draggable=true;e.addEventListener('dragstart',ev=>{ev.dataTransfer.setData('text/play-id',c.id);ev.dataTransfer.effectAllowed='move'});box.appendChild(e)})}
function setupHeroDrop(){const wrap=$('#p1BattleWrap');wrap.ondragover=e=>{if(e.dataTransfer.types.includes('text/play-id')){e.preventDefault();wrap.classList.add('dragover')}};wrap.ondragleave=()=>wrap.classList.remove('dragover');wrap.ondrop=e=>{e.preventDefault();wrap.classList.remove('dragover');const id=e.dataTransfer.getData('text/play-id');if(id)runPlayCard(id)}}
function drawPlays(p,n){
  const pi=state.players.indexOf(p);
  if(p.effects?.playLockdownActive||p.effects?.lockedPlaybookBattle===state.battle)return 0;
  let drawn=0;for(let i=0;i<n&&p.plays.length;i++){p.playHand.push(p.plays.shift());drawn++}return drawn;
}
function drawPlaysFromEffect(p,n){
  const drawn=drawPlays(p,n),pi=state.players.indexOf(p),oi=1-pi,other=state.players[oi];
  if(drawn>0&&other.effects?.makeItFairActive)drawPlays(other,drawn);
  return drawn;
}
function runPlayCard(id){const p=state.players[state.active],idx=p.playHand.findIndex(c=>c.id===id);if(idx<0)return;const card=p.playHand[idx],cost=Number(card.cost)||0;if(p.hotDogs<cost){$('#battleMessage').innerHTML=`<span class="play-toast">Not enough Hot Dogs to run ${escapeHTML(card.name)}.</span>`;return}const text=card.ability||'';let supported=true,notes=[];p.hotDogs-=cost;
  const draw=text.match(/draw\s+(\d+|one|two|three)\s+(?:additional\s+)?plays?/i);if(draw){const map={one:1,two:2,three:3};const n=Number(draw[1])||map[draw[1].toLowerCase()]||0;drawPlays(p,n);notes.push(`drew ${n} Play${n===1?'':'s'}`)}
  const loss=text.match(/(?:your\s+hero(?:'s)?(?:\s+power)?\s+)?(?:loses?|gets?)\s*-\s*(\d+)/i);const gain=text.match(/(?:your\s+hero(?:'s)?(?:\s+power)?\s+)?(?:gains?|gets?)\s*\+\s*(\d+)/i);if(loss){p.battlePower-=Number(loss[1]);notes.push(`Hero -${loss[1]}`)}if(gain){p.battlePower+=Number(gain[1]);notes.push(`Hero +${gain[1]}`)}
  if(!draw&&!loss&&!gain)supported=false;
  if(!supported){p.hotDogs+=cost;$('#battleMessage').innerHTML=`<span class="play-toast">${escapeHTML(card.name)} needs its V4 special-effect logic before it can be run automatically.</span>`;return}
  p.playHand.splice(idx,1);p.playDiscard.push(card);p.playsRunThisBattle++;$('#p1Dogs').textContent=state.players[0].hotDogs;$('#p2Dogs').textContent=state.players[1].hotDogs;renderBattlePlayHand();renderActiveHeroes(true);const hero=$('#p1ActiveHero');hero.querySelector('strong').textContent=p.battlePower;renderScoreboard();$('#battleMessage').innerHTML=`<span class="play-toast">${escapeHTML(card.name)} applied${notes.length?': '+notes.join(' • '):''}.</span>`}

// V3.4 interaction layer: Cheap Addition, discard pile, and pass-turn control.
function currentHeroWrap(){return $(`#p${state.active+1}BattleWrap`)}
function updatePlayPhaseChrome(){
  const p=state.players[state.active];
  const help=$('#playPhaseHelp'); if(help) help.textContent=`Player ${state.active+1}${state.active===state.honors?' • HONORS':''}: drag a Play onto your Hero or double-click a Play to run it.`;
  const dc=$('#discardCount'); if(dc) dc.textContent=p.playDiscard.length;
  const tc=$('#turnControls'); if(tc) tc.hidden=false;
  const nb=$('#nextPlayerBtn'); if(nb){const other=1-state.active;nb.textContent=state.active===state.turnOrder[0]?`Pass to Player ${other+1}`:`End Player ${state.active+1} Turn`;};
}
function setupHeroDropV34(){
  ['#p1BattleWrap','#p2BattleWrap'].forEach(sel=>{const w=$(sel);w.ondragover=null;w.ondrop=null;w.ondragleave=null});
  const wrap=currentHeroWrap();
  wrap.ondragover=e=>{if(e.dataTransfer.types.includes('text/play-id')){e.preventDefault();wrap.classList.add('dragover')}};
  wrap.ondragleave=()=>wrap.classList.remove('dragover');
  wrap.ondrop=e=>{e.preventDefault();wrap.classList.remove('dragover');const id=e.dataTransfer.getData('text/play-id');if(id)runPlayCardV34(id)};
}
function renderActiveHeroesV34(){clampBattlePowers();
  for(let i=0;i<2;i++){const card=state.players[i].arena[state.battle-1],el=$(`#p${i+1}ActiveHero`),pow=state.players[i].battlePower;
    el.className='revealed-hero';el.innerHTML=`<strong>${pow==null?card.power:pow}</strong>${card.mvfree?'<span class="mvfree-tag">(MVFree)</span>':''}<span>${escapeHTML(card.weapon)}</span>`}
}
function battleZoneLeft(bi){return 6.75+bi*12.45}
function positionBattleHeroes(){
  const x=battleZoneLeft(state.battle-1),active=state.active,other=1-active;
  const main=$(`#p${active+1}BattleWrap`),opp=$(`#p${other+1}BattleWrap`);
  if(main){main.style.setProperty('left',x+'%','important');main.classList.add('turn-main-hero');main.classList.remove('turn-opponent-hero');main.style.zIndex='6'}
  if(opp){opp.style.setProperty('left',x+'%','important');opp.classList.add('turn-opponent-hero');opp.classList.remove('turn-main-hero');opp.style.zIndex='5'}
}
function renderPlayedStacks(){
  const layer=$('#playedStackLayer'); if(!layer)return; layer.innerHTML='';
  state.players.forEach((p,pi)=>{(p.playedStacks||[]).forEach((stack,bi)=>{if(!stack.length)return;
    const holder=document.createElement('div');holder.className='played-stack '+(pi===1?'p2-stack':'p1-stack');
    holder.style.left=battleZoneLeft(bi)+'%';
    const isCurrent=bi===state.battle-1;
    if(isCurrent){holder.style.top=(pi===state.active?'38.5%':'15.0%');holder.style.transform=pi===state.active?'none':'scale(.68)';holder.style.transformOrigin='top center';holder.style.opacity=pi===state.active?'1':'.9'}
    else{holder.style.top='38.5%';holder.style.opacity='.78'}
    stack.forEach((card,ci)=>{const e=playEl(card);e.draggable=false;e.style.top=(ci*18)+'px';e.style.zIndex=ci+1;holder.appendChild(e);requestAnimationFrame(()=>fitPlayCard(e))});layer.appendChild(holder)})})
}
function startPlayPhaseV34(playerIndex){state.active=playerIndex;positionBattleHeroes();renderPlayedStacks();$('#playPhaseHelp').hidden=false;$('#battleBenchPanel').hidden=false;renderBattleBench();renderBattlePlayHand();renderActiveHeroesV34();renderScoreboard();setupHeroDropV34();updatePlayPhaseChrome()}
// Override the earlier function name used by finishBothSubs.
startPlayPhase=startPlayPhaseV34;

function showChoiceModal(card, cards, onChoose){
  $('#choiceEyebrow').textContent=card.name.toUpperCase();$('#choiceTitle').textContent='Choose 1 Play';$('#choiceText').textContent='Reveal the top 5 Plays. Choose one to add to your hand; the other four are shuffled back into your Playbook.';
  const box=$('#choiceCards');box.innerHTML='';cards.forEach(c=>{const e=playEl(c);e.draggable=false;e.tabIndex=0;e.setAttribute('role','button');e.setAttribute('aria-label',`Choose ${c.name}`);const choose=()=>onChoose(c);e.addEventListener('click',choose);e.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose()}});box.appendChild(e)});$('#choiceCancel').hidden=true;$('#choiceModal').hidden=false;
}
function runCheapAddition(p,card,idx,cost){
  if(p.plays.length<1){$('#battleMessage').innerHTML='<span class="play-toast">Your Playbook is empty.</span>';return}
  spendDogsForPlay(p,cost);const revealed=p.plays.splice(0,Math.min(5,p.plays.length));
  showChoiceModal(card,revealed,chosen=>{p.playHand.splice(idx,1);p.playDiscard.push(card);p.playHand.push(chosen);const rest=revealed.filter(x=>x.id!==chosen.id);p.plays=shuffle([...rest,...p.plays]);p.playsRunThisBattle++;$('#choiceModal').hidden=true;refreshAfterPlay(`${card.name} applied: ${chosen.name} added to your hand • ${rest.length} shuffled back.`)})
}
function refreshAfterPlay(message){
  for(const pl of state.players||[]){if(pl&&Number.isFinite(pl.hotDogs))pl.hotDogs=Math.max(0,pl.hotDogs)}clampBattlePowers();renderPlayedStacks();$('#p1Dogs').textContent=state.players[0].hotDogs;$('#p2Dogs').textContent=state.players[1].hotDogs;renderBattlePlayHand();renderBattleBench();renderActiveHeroesV34();renderScoreboard();setupHeroDropV34();updatePlayPhaseChrome();$('#battleMessage').innerHTML=`<span class="play-toast">${escapeHTML(message)}</span>`}
function runPlayCardV34(id){
  const p=state.players[state.active],idx=p.playHand.findIndex(c=>c.id===id);if(idx<0)return;const card=p.playHand[idx],cost=Number(card.cost)||0;
  if(p.hotDogs<cost){$('#battleMessage').innerHTML=`<span class="play-toast">Not enough Hot Dogs to run ${escapeHTML(card.name)}.</span>`;return}
  if(norm(card.name)==='cheapaddition'){runCheapAddition(p,card,idx,cost);return}
  const text=card.ability||'';let notes=[],recognized=false;
  const draw=text.match(/draw\s+(\d+|one|two|three)\s+(?:additional\s+)?plays?/i);const loss=text.match(/(?:your\s+hero(?:'s)?(?:\s+power)?\s+)?(?:loses?|gets?)\s*-\s*(\d+)/i);const gain=text.match(/(?:your\s+hero(?:'s)?(?:\s+power)?\s+)?(?:gains?|gets?)\s*\+\s*(\d+)/i);
  if(draw||loss||gain)recognized=true;
  if(!recognized){$('#battleMessage').innerHTML=`<span class="play-toast">${escapeHTML(card.name)} needs special-effect logic before it can run automatically.</span>`;return}
  p.hotDogs-=cost;
  if(draw){const map={one:1,two:2,three:3};const n=Number(draw[1])||map[draw[1].toLowerCase()]||0;drawPlays(p,n);notes.push(`drew ${n} Play${n===1?'':'s'}`)}
  if(loss){p.battlePower-=Number(loss[1]);notes.push(`Hero -${loss[1]}`)}if(gain){p.battlePower+=Number(gain[1]);notes.push(`Hero +${gain[1]}`)}
  p.playHand.splice(idx,1);p.playDiscard.push(card);p.playsRunThisBattle++;refreshAfterPlay(`${card.name} applied${notes.length?': '+notes.join(' • '):''}.`)
}
runPlayCard=runPlayCardV34;

$('#discardPileBtn').addEventListener('click',()=>{const p=state.players[state.active];$('#discardTitle').textContent=`Player ${state.active+1} Play Discard (${p.playDiscard.length})`;const box=$('#discardCards');box.innerHTML='';if(!p.playDiscard.length)box.innerHTML='<p class="sub">No Plays have been discarded yet.</p>';else p.playDiscard.slice().reverse().forEach(c=>{const e=playEl(c);e.draggable=false;box.appendChild(e)});$('#discardModal').hidden=false});
$('#closeDiscard').addEventListener('click',()=>$('#discardModal').hidden=true);
$('#nextPlayerBtn').addEventListener('click',()=>{
  const turnBtn=$('#nextPlayerBtn');if(turnBtn.dataset.mode==='nextbattle'){advanceToNextBattle();return}if(turnBtn.dataset.mode==='nextgame'){startNextSeriesGame();return}if(turnBtn.dataset.mode==='returnhome'){returnSeriesHome();return}
  if(state.pendingEffect){renderPendingEffect();return}
  if(state.active===state.turnOrder[0]){const next=state.turnOrder[1];$('#battlePlayHand').innerHTML='';$('#battleBench').innerHTML='';$('#playPhaseHelp').textContent=`Pass the screen to Player ${next+1}.`;$('#battleMessage').innerHTML=`<strong>Player ${state.active+1} turn locked.</strong> Player ${next+1} may now play cards.`;startPlayPhaseV34(next)}
  else{finishPlayPhaseForBattle()}
});
function advanceToNextBattle(){const btn=$('#nextPlayerBtn');btn.dataset.mode='';btn.disabled=false;state.players.forEach(p=>drawPlays(p,1));startBattle(state.battle+1);renderPlayedStacks()}
function finishPlayPhaseForBattle(){
  $('#battlePlayHand').innerHTML='';$('#battleBench').innerHTML='';$('#playPhaseHelp').textContent='Both players have completed their Play opportunity for this Battle.';setupHeroDropV34();
  clampBattlePowers();const a=state.players[0].battlePower,b=state.players[1].battlePower;let winner=null;if(currentGameMode().lowWins){if(a<b)winner=0;else if(b<a)winner=1;}else{if(a>b)winner=0;else if(b>a)winner=1;}
  state.battleResults[state.battle-1]=winner;if(winner!==null){state.scores[winner]++;state.honors=winner;const loser=1-winner;if(state.players[winner].effects?.playLockdownActive)state.players[winner].effects.playLockdownActive=false;if(state.players[loser].effects?.makeUpCallBattle===state.battle){recoverDogs(loser,1);state.players[loser].effects.makeUpCallBattle=0;}if(state.players[loser].effects?.consolationBattle===state.battle){drawPlaysFromEffect(state.players[loser],1);recoverDogs(loser,1);state.players[loser].effects.consolationBattle=0;}if(state.players[loser].effects?.winWeinersBattle===state.battle){recoverDogs(loser,2);state.players[loser].effects.winWeinersBattle=0;}if(state.players[winner].effects?.winWeinersBattle===state.battle){drawPlaysFromEffect(state.players[winner],1);state.players[winner].effects.winWeinersBattle=0;}if(state.players[loser].effects?.highStakesBattle===state.battle){state.players[loser].effects.nextPowerBattle=state.battle+1;state.players[loser].effects.nextPowerAmount=(state.players[loser].effects.nextPowerAmount||0)-20;state.players[loser].effects.highStakesBattle=0;}const winnerP=state.players[winner];if(winnerP.effects?.highStakesBattle===state.battle)winnerP.effects.highStakesBattle=0;}
  for(let i=0;i<2;i++){const ep=state.players[i].effects;if(ep?.easyChoiceBattle===state.battle&&ep.easyChoiceHonors!=null){state.honors=ep.easyChoiceHonors;ep.easyChoiceBattle=0;ep.easyChoiceHonors=null;}}
  // V3.63 Marked For Pickup: the face-up marked Play becomes available after this Battle.
  const pickupNotes=[];
  for(let i=0;i<2;i++){const pp=state.players[i],ep=pp.effects;if(ep?.markedPickupBattle===state.battle&&ep.markedPickupCardId){const di=pp.playDiscard.findIndex(c=>c.id===ep.markedPickupCardId);if(di>=0){const [picked]=pp.playDiscard.splice(di,1);pp.playHand.push(picked);pickupNotes.push(`P${i+1} picked up ${picked.name}`)}ep.markedPickupCardId=null;ep.markedPickupBattle=0;}}
  renderScoreboard();renderPlayedStacks();
  $('#battleMessage').innerHTML=winner===null?`<strong>Battle ${state.battle} is a draw: ${a}–${b}.</strong>`:`<strong>Player ${winner+1} wins Battle ${state.battle}, ${a}–${b}${currentGameMode().lowWins?' • LOWBALL':''}.</strong>`;
  if(pickupNotes.length)$('#battleMessage').innerHTML+=`<br><span class="play-toast">${pickupNotes.map(escapeHTML).join(' • ')}</span>`;
  const btn=$('#nextPlayerBtn');
  const clincher=state.scores[0]>=4?0:state.scores[1]>=4?1:null;
  const finalBattle=state.battle>=7;
  if(clincher!==null||finalBattle){finishSeriesGame(clincher);}
  else{btn.textContent=`Move to Battle ${state.battle+1}`;btn.dataset.mode='nextbattle';}
}
function finishSeriesGame(winner){
  const btn=$('#nextPlayerBtn');btn.disabled=false;btn.dataset.mode='';
  if(winner!==null){state.seriesScores[winner]++;$('#battleMessage').innerHTML+=`<br><strong>Player ${winner+1} wins Game ${state.gameNumber}, ${state.scores[0]}–${state.scores[1]}.</strong>`;}
  else{$('#battleMessage').innerHTML+=`<br><strong>Game ${state.gameNumber} ends tied ${state.scores[0]}–${state.scores[1]} after seven Battles.</strong>`;}
  updateSeriesScoreboard();
  const seriesWinner=state.seriesScores[0]>=2?0:state.seriesScores[1]>=2?1:null;
  if(seriesWinner!==null){state.seriesComplete=true;btn.textContent='Return to Home';btn.dataset.mode='returnhome';$('#battleMessage').innerHTML+=`<br><strong>Player ${seriesWinner+1} wins the best-of-3 series, ${state.seriesScores[0]}–${state.seriesScores[1]}.</strong>`;}
  else{btn.textContent='Start Next Game';btn.dataset.mode='nextgame';}
}
function startNextSeriesGame(){state.gameNumber++;beginSeriesGame();}
function returnSeriesHome(){location.reload();}



// V3.5 — demo Playbook effect engine + required discard workflow.
state.pendingEffect=null; state.deepPlaybook=false; state.honors=0; state.turnOrder=[0,1];
state.players.forEach(p=>{p.effects={inflationThrough:0,discountThrough:0,blockedBattle:0,grilledBandit:false,qbSneakBattle:0,permanentPowerBonus:0,makeUpCallBattle:0,consolationBattle:0,steelMarchStart:0,steelMarchThrough:0,delayedRecoveryBattle:0,lassoBattle:0,restrictedBattle:0,restrictedBy:null,nextPowerBattle:0,nextPowerAmount:0,highStakesBattle:0};p.dogsSpentThisBattle=0;p.playHistory=[];p.playedStacks=Array.from({length:7},()=>[])});

function otherPlayer(){return state.players[1-state.active]}
function activePlayer(){return state.players[state.active]}
function effectiveCost(card){const p=activePlayer();let c=Number(card.cost)||0;const k=norm(card.name);if(p.effects.inflationThrough>=state.battle)c+=2;if(p.effects.discountThrough>=state.battle)c=Math.max(0,c-1);if(k==='flashsale')c=Math.max(0,c-1);if(k==='freebooster'&&state.battle>1&&!p.playHistory.some(x=>x.usedBattle===state.battle-1))c=0;if(k==='unifiedfront'){const revealed=p.arena.slice(0,state.battle).filter(Boolean);if(revealed.length&&revealed.every(h=>h.weapon===revealed[0].weapon))c=0}return c}
// V3.59: one path for HD actually SPENT on Plays. Keeps total HD, Battle spend tracking, and Champion's Lasso synchronized.
function spendDogsForPlay(p,amount){amount=Math.max(0,Number(amount)||0);if(!amount)return true;if(p.hotDogs<amount)return false;const pi=state.players.indexOf(p),oi=1-pi,opp=state.players[oi];p.hotDogs-=amount;p.dogsSpentThisBattle=(p.dogsSpentThisBattle||0)+amount;if(opp?.effects?.lassoBattle===state.battle)recoverDogs(oi,amount);return true}

function recoverDogs(playerIndex,n){
  const target=state.players[playerIndex];
  const requested=Math.max(0,Number(n)||0);
  // Recovery eligibility is based on Hot Dogs the target player has actually spent.
  // Grilled Bandit redirects that eligible recovery BEFORE the target receives anything.
  const eligible=Math.max(0,Math.min(requested,10-target.hotDogs));
  if(eligible<=0)return playerIndex;

  const banditIndex=1-playerIndex;
  const bandit=state.players[banditIndex];
  if(bandit.effects?.grilledBandit){
    bandit.hotDogs=Math.min(10,bandit.hotDogs+eligible);
    return banditIndex;
  }

  target.hotDogs=Math.min(10,target.hotDogs+eligible);
  return playerIndex;
}
function showRandomizer(kind){return new Promise(resolve=>{const modal=$('#randomizerModal'),visual=$('#randomizerVisual'),title=$('#randomizerTitle'),help=$('#randomizerHelp'),btn=$('#randomizerBtn');const dieFaces=['⚀','⚁','⚂','⚃','⚄','⚅'];const isDie=kind==='die';title.textContent=isDie?'Roll the die':'Flip the coin';help.textContent='Click below to reveal the result.';btn.textContent=isDie?'ROLL DIE':'FLIP COIN';visual.className='randomizer-visual'+(isDie?'':' coin');visual.textContent=isDie?'⚄':'COIN';modal.hidden=false;let done=false;btn.onclick=()=>{if(done)return;done=true;visual.classList.add('rolling');btn.disabled=true;let ticks=0;const timer=setInterval(()=>{visual.textContent=isDie?dieFaces[Math.floor(Math.random()*6)]:(Math.random()<.5?'HEADS':'TAILS');if(++ticks>=8){clearInterval(timer);const result=isDie?1+Math.floor(Math.random()*6):(Math.random()<.5?'heads':'tails');visual.textContent=isDie?dieFaces[result-1]:result.toUpperCase();visual.classList.remove('rolling');help.textContent=isDie?`Result: ${result}`:`Result: ${result.toUpperCase()}`;btn.textContent='CONTINUE';btn.disabled=false;btn.onclick=()=>{modal.hidden=true;btn.onclick=null;resolve(result)}}},75)}})}
async function rollDie(playerIndex){const n=await showRandomizer('die');if(state.deepPlaybook)drawPlays(state.players[playerIndex],1);return n}
async function tossCoin(){return await showRandomizer('coin')}
function showDiceDuelRandomizer(playerA,playerB){return new Promise(resolve=>{const modal=$('#randomizerModal'),visual=$('#randomizerVisual'),title=$('#randomizerTitle'),help=$('#randomizerHelp'),btn=$('#randomizerBtn');const dieFaces=['⚀','⚁','⚂','⚃','⚄','⚅'];title.textContent='Dice Duel';help.textContent=`Player ${playerA+1} vs Player ${playerB+1}. Roll both dice.`;btn.textContent='ROLL BOTH DICE';visual.className='randomizer-visual dice-duel';visual.innerHTML='<span>⚄</span><b>VS</b><span>⚄</span>';modal.hidden=false;let done=false;btn.disabled=false;btn.onclick=()=>{if(done)return;done=true;visual.classList.add('rolling');btn.disabled=true;let ticks=0;const timer=setInterval(()=>{visual.innerHTML=`<span>${dieFaces[Math.floor(Math.random()*6)]}</span><b>VS</b><span>${dieFaces[Math.floor(Math.random()*6)]}</span>`;if(++ticks>=10){clearInterval(timer);const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);visual.innerHTML=`<span>${dieFaces[a-1]}</span><b>VS</b><span>${dieFaces[b-1]}</span>`;visual.classList.remove('rolling');help.textContent=`Player ${playerA+1}: ${a} • Player ${playerB+1}: ${b}`;btn.textContent='CONTINUE';btn.disabled=false;btn.onclick=()=>{modal.hidden=true;visual.className='randomizer-visual';btn.onclick=null;resolve([a,b])}}},75)}})}
function commitPlay(p,card,idx){p.playHand.splice(idx,1);if(card._copycatName){card.name=card._copycatName;card.ability=card._copycatAbility||card.ability;delete card._copycatName;delete card._copycatAbility;}card.usedBattle=state.battle;if(!p.playedStacks)p.playedStacks=Array.from({length:7},()=>[]);p.playedStacks[state.battle-1].push(card);p.playHistory.push(card);p.playsRunThisBattle++;renderPlayedStacks()}
function drawHeroes(p,n){for(let i=0;i<n&&p.heroes.length;i++)p.bench.push(p.heroes.shift())}
function startPending(type,count,card,extra={}){state.pendingEffect={type,count,remaining:count,card,...extra};renderBattlePlayHand();renderBattleBench();renderPendingEffect();setupHeroDropV35()}
function renderPendingEffect(){const z=$('#effectDiscardZone'),done=$('#effectDoneBtn');const pe=state.pendingEffect;if(!pe){z.hidden=true;if(done)done.hidden=true;$('#battlePlayHand').classList.remove('pending-discard');return}z.hidden=false;$('#battlePlayHand').classList.add('pending-discard');const noun=pe.type==='hero'?'Hero':'Play',optional=!!pe.optional;if(done){done.hidden=!optional;done.textContent=pe.remaining===pe.count?'SKIP DISCARD':'DONE DISCARDING'}$('#effectDiscardHelp').textContent=optional?`Discard up to ${pe.remaining} more ${noun}${pe.remaining===1?'':'s'} (optional)`:`Drag ${pe.remaining} ${noun}${pe.remaining===1?'':'s'} here`;$('#battleMessage').innerHTML=`<span class="play-toast effect-prompt">${escapeHTML(pe.card.name)}: ${optional?'you may discard up to':'discard'} ${pe.remaining} ${noun}${pe.remaining===1?'':'s'}${optional?' • choose Done/Skip whenever you are finished.':' before you can run another Play.'}</span>`}
function completePending(){const pe=state.pendingEffect;if(!pe)return;if(pe.after==='fallen'){const p=activePlayer(),w=pe.weapon,n=p.heroDiscard.filter(h=>h.weapon===w).length;p.battlePower+=n*10}if(pe.after==='tradeup'){drawPlays(activePlayer(),2)}state.pendingEffect=null;refreshAfterPlay(`${pe.card.name} fully resolved.`);renderPendingEffect()}
function discardHeroById(id){const pe=state.pendingEffect;if(!pe||pe.type!=='hero')return;const p=activePlayer(),i=p.bench.findIndex(h=>h.id===id);if(i<0)return;const [h]=p.bench.splice(i,1);p.heroDiscard.push(h);if(pe.after==='fallen'&&!pe.weapon)pe.weapon=h.weapon;pe.remaining--;if(pe.remaining<=0)completePending();else{renderBattleBench();renderPendingEffect()}}
function discardPlayById(id){const pe=state.pendingEffect;if(!pe||pe.type!=='play')return;const p=activePlayer(),i=p.playHand.findIndex(c=>c.id===id);if(i<0)return;const [c]=p.playHand.splice(i,1);c.usedBattle=state.battle;p.playDiscard.push(c);pe.remaining--;if(pe.remaining<=0)completePending();else{renderBattlePlayHand();renderPendingEffect()}}

renderBattleBench=function(){const box=$('#battleBench');box.innerHTML='';activePlayer().bench.forEach(c=>{const e=heroEl(c);e.draggable=!!(state.pendingEffect&&state.pendingEffect.type==='hero');if(e.draggable){e.classList.add('pending-discard');e.addEventListener('dragstart',ev=>{ev.dataTransfer.setData('text/hero-discard-id',c.id);ev.dataTransfer.effectAllowed='move'})}box.appendChild(e)});$('#heroDiscardCount').textContent=activePlayer().heroDiscard.length}
renderBattlePlayHand=function(){const box=$('#battlePlayHand');box.innerHTML='';activePlayer().playHand.forEach(c=>{const e=playEl(c);const shownCost=c.freeOnce?0:effectiveCost(c);const costEl=e.querySelector('.cost');if(costEl){const base=Number(c.cost)||0;costEl.innerHTML=`${shownCost}<small>HD</small>`;if(shownCost!==base&&!c.freeOnce){costEl.title=`Base ${base} HD + Dog Gone Inflation`;costEl.classList.add('inflated-cost')}}e.draggable=true;e.title=state.pendingEffect?'Resolve the required discard first':'Drag to your Hero or double-click to play';e.addEventListener('dragstart',ev=>{if(state.pendingEffect&&state.pendingEffect.type==='play')ev.dataTransfer.setData('text/play-discard-id',c.id);else ev.dataTransfer.setData('text/play-id',c.id);ev.dataTransfer.effectAllowed='move'});e.addEventListener('dblclick',ev=>{ev.preventDefault();if(state.pendingEffect){renderPendingEffect();return}runPlayCardV34(c.id)});box.appendChild(e);requestAnimationFrame(()=>fitPlayCard(e))})}
function setupEffectDiscard(){const z=$('#effectDiscardZone'),done=$('#effectDoneBtn');z.ondragover=e=>{if(state.pendingEffect){e.preventDefault();z.classList.add('dragover')}};z.ondragleave=()=>z.classList.remove('dragover');z.ondrop=e=>{e.preventDefault();z.classList.remove('dragover');const hid=e.dataTransfer.getData('text/hero-discard-id'),pid=e.dataTransfer.getData('text/play-discard-id');if(hid)discardHeroById(hid);if(pid)discardPlayById(pid)};if(done)done.onclick=()=>{if(state.pendingEffect?.optional)completePending()}}
const setupHeroDropBaseV35=setupHeroDropV34;
function setupHeroDropV35(){setupHeroDropBaseV35();setupEffectDiscard()}
setupHeroDropV34=setupHeroDropV35;

function chooseCards(title,text,cards,kind,onChoose){$('#choiceEyebrow').textContent='PLAY EFFECT';$('#choiceTitle').textContent=title;$('#choiceText').textContent=text;const box=$('#choiceCards');box.innerHTML='';cards.forEach(c=>{const e=kind==='hero'?heroEl(c):playEl(c);e.draggable=false;e.tabIndex=0;const go=()=>onChoose(c);e.addEventListener('click',go);e.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();go()}});box.appendChild(e)});$('#choiceCancel').hidden=true;$('#choiceModal').hidden=false}
function closeChoice(){ $('#choiceModal').hidden=true }
function queueHeroSwapFromDiscard(p,card,idx,cost,weapon=null){
  const eligible=p.heroDiscard.filter(h=>!weapon||String(h.weapon).toUpperCase()===String(weapon).toUpperCase());
  if(!eligible.length){$('#battleMessage').innerHTML=`<span class="play-toast">${escapeHTML(card.name)}: no eligible Hero is in your discard pile.</span>`;return true}
  chooseCards('Choose a Hero from your discard pile','Select the Hero to swap with your current Battle Hero.',eligible,'hero',chosen=>{commitPlay(p,card,idx);const old=p.arena[state.battle-1];p.heroDiscard=p.heroDiscard.filter(h=>h.id!==chosen.id);if(old)p.heroDiscard.push(old);p.arena[state.battle-1]=chosen;p.battlePower=Math.max(0,Number(chosen.power)+(p.effects?.permanentPowerBonus||0));closeChoice();renderPlayedStacks();refreshAfterPlay(`${card.name}: swapped in ${chosen.power} ${chosen.weapon} from the Hero discard pile.`)});return true
}
function tryQueuedDiscardPileResolver(card,p,idx,cost){
  const rule=masterPlayRule(card),t=String(rule?.description||card.ability||card.text||'');
  if(!/discard pile/i.test(t))return false;
  if(/swap/i.test(t)&&/current hero/i.test(t)&&/hero/i.test(t)){
    const m=t.match(/(?:a|an|your)\s+(Brawl|Steel|Fire|Ice|Glow|Hex|Alt|Super)\s+Hero/i);
    return queueHeroSwapFromDiscard(p,card,idx,cost,m?m[1]:null);
  }
  return false;
}
function choosePlayFromDiscard(p,card,idx,cost){const eligible=(p.playedStacks||[]).slice(0,state.battle-1).flat();if(!eligible.length){$('#battleMessage').innerHTML='<span class="play-toast">No Play used in a previous Battle is available.</span>';return}chooseCards('Choose a previous Play','Add one Play used in a previous Battle back to your hand.',eligible,'play',chosen=>{spendDogsForPlay(p,cost);commitPlay(p,card,idx);for(const stack of p.playedStacks){const di=stack.findIndex(x=>x.id===chosen.id);if(di>=0){p.playHand.push(stack.splice(di,1)[0]);break}}closeChoice();renderPlayedStacks();refreshAfterPlay(`${card.name}: ${chosen.name} returned to your hand.`)})}

// V3.30 — Refill And Reload: recycle a Play from a previous Battle into the Playbook, shuffle, then draw 1.
function refillAndReload(p,card,idx,cost){
  const eligible=(p.playedStacks||[]).slice(0,state.battle-1).flat();
  if(!eligible.length){$('#battleMessage').innerHTML='<span class="play-toast">Refill And Reload cannot be run: you have no Plays from a previous Battle to shuffle into your Playbook.</span>';return}
  const resolveChosen=(chosen)=>{
    spendDogsForPlay(p,cost);
    let recycled=null;
    for(let bi=0;bi<state.battle-1;bi++){const stack=p.playedStacks[bi]||[];const di=stack.findIndex(x=>x.id===chosen.id);if(di>=0){recycled=stack.splice(di,1)[0];break}}
    if(!recycled){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,(p.dogsSpentThisBattle||0)-cost);return}
    p.plays=shuffle([...p.plays,recycled]);
    commitPlay(p,card,idx);
    drawPlays(p,1);
    closeChoice();renderPlayedStacks();
    refreshAfterPlay(`${card.name}: ${recycled.name} shuffled into your Playbook • drew 1 Play.`);
  };
  if(state.computerMode&&state.active===1){
    const chosen=eligible.slice().sort((a,b)=>aiCardUtility(b)-aiCardUtility(a))[0];
    resolveChosen(chosen);return;
  }
  chooseCards('Refill And Reload','Choose 1 Play you ran in a previous Battle. It will be shuffled into your Playbook, then you will draw 1 Play.',eligible,'play',resolveChosen);
}
function lockerRoom(p,card,idx,cost){const revealed=p.heroes.splice(0,Math.min(5,p.heroes.length));if(!revealed.length)return;chooseCards('Choose 1 Hero','Add one revealed Hero to your hand. The rest go to your Hero discard pile.',revealed,'hero',chosen=>{spendDogsForPlay(p,cost);commitPlay(p,card,idx);p.bench.push(chosen);p.heroDiscard.push(...revealed.filter(h=>h.id!==chosen.id));closeChoice();refreshAfterPlay(`${card.name}: Hero added to hand; ${revealed.length-1} discarded.`)})}
function byAnyMeans(p,card,idx,cost){if(!p.plays.length)return;chooseCards('Search your Playbook','Choose any Play to run for free.',p.plays,'play',chosen=>{spendDogsForPlay(p,cost);commitPlay(p,card,idx);p.plays=p.plays.filter(x=>x.id!==chosen.id);p.playHand.push(chosen);p.plays=shuffle(p.plays);closeChoice();refreshAfterPlay(`${card.name}: ${chosen.name} added to hand at 0 HD for this run.`);chosen.freeOnce=true})}


// V3.30 — master Play library + Refill And Reload interactive resolver.
// The exact wording/cost for every unique Play in all plays.xlsx is loaded in MASTER_PLAY_LIBRARY.
function masterPlayRule(card){return (window.MASTER_PLAY_LIBRARY||{})[norm(card.name)]||null}
function resolveSimpleMasterPlay(card,p,opp,finish){
  const rule=masterPlayRule(card); if(!rule)return false;
  const t=String(rule.description||card.ability||'').trim();
  let m;
  // Unconditional current-Hero Power changes.
  if((m=t.match(/^Your Hero gets \+(\d+)\.?$/i))){p.battlePower+=Number(m[1]);finish(`${card.name}: +${m[1]} Power.`);return true}
  if((m=t.match(/^Your Hero (?:gets|loses) -(\d+)\.?$/i))){p.battlePower=Math.max(0,p.battlePower-Number(m[1]));finish(`${card.name}: -${m[1]} Power.`);return true}
  if((m=t.match(/^Your opponent'?s Hero gets -(\d+)\.?$/i))){opp.battlePower=Math.max(0,opp.battlePower-Number(m[1]));finish(`${card.name}: opponent Hero -${m[1]} Power.`);return true}
  if((m=t.match(/^Both Heroes (?:get|lose) -(\d+)\.?$/i))){p.battlePower-=Number(m[1]);opp.battlePower-=Number(m[1]);finish(`${card.name}: both Heroes -${m[1]} Power.`);return true}
  if((m=t.match(/^Both Heroes get \+(\d+)\.?$/i))){p.battlePower+=Number(m[1]);opp.battlePower+=Number(m[1]);finish(`${card.name}: both Heroes +${m[1]} Power.`);return true}
  // Straight draws / recovery.
  if((m=t.match(/^Draw (\d+) Plays?\.?$/i))){drawPlays(p,Number(m[1]));finish(`${card.name}: drew ${m[1]} Play${m[1]==='1'?'':'s'}.`);return true}
  if((m=t.match(/^Recover (?:up to )?(\d+) Hot Dogs?(?: from your Discard Pile)?\.?$/i))){recoverDogs(state.active,Number(m[1]));finish(`${card.name}: recovered up to ${m[1]} Hot Dogs.`);return true}
  if((m=t.match(/^Your opponent draws? (\d+) Plays?\.?$/i))){drawPlays(opp,Number(m[1]));finish(`${card.name}: opponent drew ${m[1]} Play${m[1]==='1'?'':'s'}.`);return true}
  // Common combined unconditional effects.
  if((m=t.match(/^Your Hero gets \+(\d+)\. Draw (\d+) Plays?\.?$/i))){p.battlePower+=Number(m[1]);drawPlays(p,Number(m[2]));finish(`${card.name}: +${m[1]} Power and drew ${m[2]} Play${m[2]==='1'?'':'s'}.`);return true}
  if((m=t.match(/^Draw (\d+) Plays?\. Your Hero gets -(\d+)\.?$/i))){drawPlays(p,Number(m[1]));p.battlePower-=Number(m[2]);finish(`${card.name}: drew ${m[1]} Play${m[1]==='1'?'':'s'} • Hero -${m[2]} Power.`);return true}
  // Spreadsheet wording variants for otherwise-straightforward effects.
  if((m=t.match(/^Draw (\d+) additional Plays?,? but your Hero (?:loses|gets) -(\d+)\.?$/i))){drawPlays(p,Number(m[1]));p.battlePower-=Number(m[2]);finish(`${card.name}: drew ${m[1]} Play${m[1]==='1'?'':'s'} • Hero -${m[2]} Power.`);return true}
  if(/^Draw (?:a|1) Play from your Playbook\.?$/i.test(t)){drawPlays(p,1);finish(`${card.name}: drew 1 Play.`);return true}
  if((m=t.match(/^Draw (\d+) additional Plays?\.?$/i))){drawPlays(p,Number(m[1]));finish(`${card.name}: drew ${m[1]} Play${m[1]==='1'?'':'s'}.`);return true}
  return false;
}


// V3.50 — complete Lowball 34-card deck helpers.
function cancelRestOfGamePlayEffects(){
  state.deepPlaybook=false;
  state.players.forEach(p=>{
    const bonus=p.effects?.permanentPowerBonus||0;
    if(bonus&&p.battlePower!=null)p.battlePower=Math.max(0,p.battlePower-bonus);
    p.effects.permanentPowerBonus=0;
    p.effects.grilledBandit=false;
    p.effects.rollingReset=false;
  });
}
async function rollDieSmart(playerIndex, keepFn=null){
  let n=await rollDie(playerIndex),p=state.players[playerIndex];
  if(!p.effects?.rollingReset)return n;
  let reroll=false;
  if(state.computerMode&&playerIndex===1){reroll=keepFn?!keepFn(n):false}
  else reroll=!keepFn?confirm(`Rolling Reset: you rolled ${n}. Re-roll this die?`):(!keepFn(n)&&confirm(`Rolling Reset: you rolled ${n}. Re-roll this die?`));
  if(reroll)n=await rollDie(playerIndex);
  return n;
}
function freePlaySearch(p,card,idx,cost,maxCost=3){
  const eligible=p.plays.filter(x=>(Number(x.cost)||0)<=maxCost);if(!eligible.length)return false;
  const resolve=chosen=>{commitPlay(p,card,idx);p.plays=p.plays.filter(x=>x.id!==chosen.id);p.plays=shuffle(p.plays);chosen.freeOnce=true;p.playHand.push(chosen);closeChoice();refreshAfterPlay(`${card.name}: running ${chosen.name} for free.`);setTimeout(()=>runPlayCardV34(chosen.id),80)};
  if(state.computerMode&&state.active===1){const chosen=eligible.slice().sort((a,b)=>aiCardUtility(b)-aiCardUtility(a))[0];resolve(chosen)}else chooseCards(card.name,`Choose a Play costing ${maxCost} HD or less to run for free.`,eligible,'play',resolve);
  return true;
}

runPlayCardV34=async function(id){
  if(state.pendingEffect){renderPendingEffect();return}
  const p=activePlayer(),opp=otherPlayer(),idx=p.playHand.findIndex(c=>c.id===id);if(idx<0)return;const card=p.playHand[idx],key=norm(card.name);
  if(p.effects.blockedBattle===state.battle){$('#battleMessage').innerHTML='<span class="play-toast">Steel Defense prevents you from running Plays this Battle.</span>';return}
  if(p.effects?.restrictedBattle===state.battle && p.effects?.restrictedBy!==state.active && (p.playsRunThisBattle||0)>=1){$('#battleMessage').innerHTML='<span class="play-toast">Restricted List allows you to run only 1 Play this Battle.</span>';return}
  let cost=card.freeOnce?0:effectiveCost(card);if(key==='copycat'){const last=[...(p.playHistory||[])].reverse().find(x=>norm(x.name)!=='copycat');if(!last){$('#battleMessage').innerHTML='<span class="play-toast">Copycat needs a previously used Play to copy.</span>';return}cost=Number(last.cost)||0;if(p.effects.inflationThrough>=state.battle)cost+=2;if(p.effects.discountThrough>=state.battle)cost=Math.max(0,cost-1);}if(p.effects?.firstPlayFreeBattle===state.battle&&(p.playsRunThisBattle||0)===0)cost=0;card.freeOnce=false;if(p.hotDogs<cost){$('#battleMessage').innerHTML=`<span class="play-toast">Not enough Hot Dogs. ${escapeHTML(card.name)} costs ${cost}.</span>`;return}
  if(key==='cheapaddition'){runCheapAddition(p,card,idx,cost);return}
  if(key==='reload'){choosePlayFromDiscard(p,card,idx,cost);return}
  if(key==='refillandreload'){refillAndReload(p,card,idx,cost);return}
  if(key==='lockerroomevacuation'){lockerRoom(p,card,idx,cost);return}
  if(key==='byanymeansnecessary'){byAnyMeans(p,card,idx,cost);return}
  spendDogsForPlay(p,cost);let msg=card.name;
  const finish=(m=msg)=>{commitPlay(p,card,idx);refreshAfterPlay(m)};
  switch(key){
    case 'copycat':{const last=[...(p.playHistory||[])].reverse().find(x=>norm(x.name)!=='copycat');if(!last){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,p.dogsSpentThisBattle-cost);$('#battleMessage').innerHTML='<span class="play-toast">Copycat needs a previously used Play.</span>';return}const originalName=card.name,originalAbility=card.ability;card._copycatName=originalName;card._copycatAbility=originalAbility;card.name=last.name;card.ability=last.ability;card.cost=0;card.freeOnce=true;setTimeout(()=>runPlayCardV34(card.id),0);return}
    case 'rollsomeplays':{const r=await rollDieSmart(state.active);drawPlaysFromEffect(p,r);finish(`${card.name}: rolled ${r} • drew ${r} Play${r===1?'':'s'}${state.deepPlaybook?' plus the Deep draw':''}.`);return}
    case 'deckburn':{const r=await rollDieSmart(state.active);const gone=p.plays.splice(0,Math.min(r,p.plays.length));p.playDiscard.push(...gone);finish(`${card.name}: rolled ${r} • discarded ${gone.length} Play${gone.length===1?'':'s'} from the top of the Playbook.`);return}
    case 'cheapdraw':drawPlaysFromEffect(p,3);drawPlaysFromEffect(opp,1);finish(`${card.name}: you drew 3 Plays • opponent drew 1.`);return;
    case 'instantrefund':{const n=(p.playsRunThisBattle||0)+1;recoverDogs(state.active,n);finish(`${card.name}: recovered up to ${n} Hot Dog${n===1?'':'s'} for ${n} Play${n===1?'':'s'} used this Battle.`);return}
    case 'overflowdraw':{if(p.hotDogs>=5){drawPlaysFromEffect(p,2);p.hotDogs=Math.max(0,p.hotDogs-1);finish(`${card.name}: drew 2 Plays • lost 1 Hot Dog.`)}else finish(`${card.name}: no effect because you have fewer than 5 Hot Dogs.`);return}
    case 'honorable':p.effects.easyChoiceBattle=state.battle;p.effects.easyChoiceHonors=state.active;drawPlaysFromEffect(p,1);finish(`${card.name}: drew 1 Play • you get Honors next Battle.`);return;
    case 'theheroesfavoritehotdogs':{const n=p.heroDiscard.length;recoverDogs(state.active,n);finish(`${card.name}: ${n} Heroes in discard • recovered up to ${n} Hot Dog${n===1?'':'s'}.`);return}
    case 'playingahead':{if(p.battlePower>opp.battlePower){drawPlaysFromEffect(p,1);finish(`${card.name}: opponent Power is lower • drew 1 Play.`)}else finish(`${card.name}: condition not met.`);return}
    case 'fairtrade':recoverDogs(1-state.active,1);drawPlaysFromEffect(p,2);finish(`${card.name}: opponent recovered up to 1 Hot Dog • you drew 2 Plays.`);return;
    case 'lockedplaybook':opp.effects.lockedPlaybookBattle=state.battle;finish(`${card.name}: opponent cannot draw Plays for the rest of this Battle.`);return;
    case 'seriesmvpaward':{const h=p.arena[state.battle-1];if(h?.mvfree||norm(h?.hero||'')==='mvfree'){p.battlePower+=30;finish(`${card.name}: MVFree Hero +30 Power.`)}else finish(`${card.name}: no effect because the active Hero is not MVFree.`);return}
    case 'glowup':if(p.arena[state.battle-1]?.weapon==='GLOW'){p.battlePower+=20;finish(`${card.name}: Glow Hero +20 Power.`)}else finish(`${card.name}: no effect because active Hero is not Glow.`);return;
    case 'playreset':{const a=p.playHand.filter(x=>x.id!==card.id),b=opp.playHand.slice();p.playHand=p.playHand.filter(x=>x.id===card.id);opp.playHand=[];p.plays=shuffle([...p.plays,...a]);opp.plays=shuffle([...opp.plays,...b]);drawPlaysFromEffect(p,a.length);drawPlaysFromEffect(opp,b.length);finish(`${card.name}: both players shuffled their hands into their Playbooks and redrew the same number.`);return}
    case 'cleanslate':{const a=p.playHand.filter(x=>x.id!==card.id),b=opp.playHand.slice();p.playDiscard.push(...a);opp.playDiscard.push(...b);p.playHand=p.playHand.filter(x=>x.id===card.id);opp.playHand=[];drawPlaysFromEffect(p,3);drawPlaysFromEffect(opp,3);finish(`${card.name}: both players discarded their Play hands and drew 3 new Plays.`);return}
    case 'letsmakeitfair':p.effects.makeItFairActive=true;finish(`${card.name}: whenever opponent draws because of a Play effect, you also draw that many Plays.`);return;
    case 'winorweiners':p.effects.winWeinersBattle=state.battle;finish(`${card.name}: lose this Battle = recover 2 Hot Dogs • win = draw 1 Play.`);return;
    case 'riskyrecovery':{const c=await tossCoin();if(c==='heads')recoverDogs(state.active,3);drawPlaysFromEffect(opp,2);finish(`${card.name}: ${c.toUpperCase()}${c==='heads'?' • recovered up to 3 Hot Dogs':''} • opponent drew 2 Plays.`);return}
    case 'playlockdown':opp.effects.playLockdownActive=true;finish(`${card.name}: opponent cannot draw Plays until they win a Battle.`);return;
    case '4newplaysbaby':{
      // Commit this Play first so the card being resolved can never be shuffled/drawn by its own effect.
      commitPlay(p,card,idx);
      const old=[...p.playHand];
      p.playHand=[];
      p.plays=shuffle([...p.plays,...old]);
      const drew=drawPlaysFromEffect(p,4);
      refreshAfterPlay(`${card.name}: shuffled ${old.length} Plays from hand into Playbook • drew ${drew} new Play${drew===1?'':'s'}.`);
      return
    }
    case 'getwhatyoupayfor':{const max=p.hotDogs;let pay=0;if(state.computerMode&&state.active===1){const gap=currentGameMode().lowWins?p.battlePower-opp.battlePower:opp.battlePower-p.battlePower;pay=Math.max(0,Math.min(max,Math.ceil(Math.max(0,gap+1)/10)))}else{const ans=prompt(`Get What You Pay For: choose Hot Dogs to pay (0-${max}). Each gives +10 Power.`,'0');pay=Math.max(0,Math.min(max,Number.parseInt(ans||'0',10)||0))}spendDogsForPlay(p,pay);p.battlePower+=pay*10;finish(`${card.name}: paid ${pay} Hot Dog${pay===1?'':'s'} • +${pay*10} Power.`);return}
    case 'payitforme':p.effects.opponentPaysSubBattle=state.battle+1;finish(`${card.name}: if you substitute next Battle, opponent pays the 2 Hot Dog cost.`);return;
    case 'lunchbreak':{const glow=p.bench.filter(h=>h.weapon==='GLOW');if(!glow.length){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,p.dogsSpentThisBattle-cost);$('#battleMessage').innerHTML='<span class="play-toast">Lunch Break requires a Glow Hero in your hand.</span>';return}const resolve=h=>{p.bench=p.bench.filter(x=>x.id!==h.id);p.heroDiscard.push(h);recoverDogs(state.active,3);closeChoice();finish(`${card.name}: discarded a Glow Hero • recovered up to 3 Hot Dogs.`)};if(state.computerMode&&state.active===1)resolve(glow.slice().sort((a,b)=>Number(a.power)-Number(b.power))[0]);else chooseCards(card.name,'Choose a Glow Hero to discard.',glow,'hero',resolve);return}
    case 'dumpsterbattle':{const mine=p.heroDiscard.slice(),theirs=opp.heroDiscard.slice();if(!mine.length&&!theirs.length){finish(`${card.name}: no Heroes are available in either discard pile.`);return}const swap=(pl,chosen)=>{if(!chosen)return;const old=pl.arena[state.battle-1];pl.heroDiscard=pl.heroDiscard.filter(h=>h.id!==chosen.id);pl.heroDiscard.push(old);pl.arena[state.battle-1]=chosen;pl.battlePower=Math.max(0,Number(chosen.power)+(pl.effects?.permanentPowerBonus||0))};const chooseOpp=()=>{if(!theirs.length){finish(`${card.name}: replaced available active Hero from discard.`);return}if(state.computerMode&&state.active===1){const low=currentGameMode().lowWins,chosen=theirs.slice().sort((a,b)=>low?Number(a.power)-Number(b.power):Number(b.power)-Number(a.power))[0];swap(opp,chosen);finish(`${card.name}: both possible active Heroes replaced from discard.`)}else chooseCards(card.name,'Choose an opponent Hero from their discard pile.',theirs,'hero',h=>{swap(opp,h);closeChoice();finish(`${card.name}: both possible active Heroes replaced from discard.`)})};if(!mine.length){chooseOpp();return}if(state.computerMode&&state.active===1){const low=currentGameMode().lowWins,chosen=mine.slice().sort((a,b)=>low?Number(a.power)-Number(b.power):Number(b.power)-Number(a.power))[0];swap(p,chosen);chooseOpp()}else chooseCards(card.name,'Choose your Hero from discard to replace the active Hero.',mine,'hero',h=>{swap(p,h);closeChoice();chooseOpp()});return}
    case 'burnthetimeline':{
      const fire=p.bench.filter(h=>h.weapon==='FIRE');
      if(!fire.length){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,p.dogsSpentThisBattle-cost);$('#battleMessage').innerHTML='<span class="play-toast">Burn The Timeline requires a Fire Hero in your hand.</span>';return}
      const resolve=h=>{p.bench=p.bench.filter(x=>x.id!==h.id);p.heroDiscard.push(h);cancelRestOfGamePlayEffects();finish(`${card.name}: discarded a Fire Hero • all rest-of-game Play effects canceled.`);closeChoice()};
      if(state.computerMode&&state.active===1)resolve(fire.slice().sort((a,b)=>Number(b.power)-Number(a.power))[0]);else chooseCards(card.name,'Choose a Fire Hero to discard.',fire,'hero',resolve);return}
    case 'emergencyshutdown':if(p.hotDogs<=2){cancelRestOfGamePlayEffects();finish(`${card.name}: all rest-of-game Play effects canceled.`)}else finish(`${card.name}: no effect because you have more than 2 Hot Dogs.`);return;
    case 'bigtimerecruit':{
      const top=p.heroes.splice(0,3);if(!top.length){finish(`${card.name}: Hero Deck is empty.`);return}
      const resolve=h=>{p.bench.push(h);p.heroes=shuffle([...p.heroes,...top.filter(x=>x.id!==h.id)]);closeChoice();finish(`${card.name}: added a Hero from the top 3 to your hand and shuffled the rest.`)};
      if(state.computerMode&&state.active===1){const low=currentGameMode().lowWins;resolve(top.slice().sort((a,b)=>low?Number(a.power)-Number(b.power):Number(b.power)-Number(a.power))[0])}else chooseCards(card.name,'Choose 1 of the top 3 Heroes to add to your hand.',top,'hero',resolve);return}
    case 'easychoice':{
      let who;if(state.computerMode&&state.active===1){who=1}else{who=confirm('Easy Choice: OK = you get Honors next Battle. Cancel = opponent gets Honors.')?state.active:1-state.active}
      p.effects.easyChoiceBattle=state.battle;p.effects.easyChoiceHonors=who;finish(`${card.name}: Player ${who+1} will get Honors next Battle regardless of this Battle's outcome.`);return}
    case 'evenmoney':{const c=await tossCoin();if(c==='heads')p.battlePower+=20;else opp.battlePower+=20;finish(`${card.name}: ${c.toUpperCase()} • ${c==='heads'?'your':'opponent'} Hero +20 Power.`);return}
    case 'tradeup':drawPlays(p,0);commitPlay(p,card,idx);startPending('play',1,card,{after:'tradeup'});refreshAfterPlay(`${card.name}: discard 1 Play from your hand, then draw 2.`);renderPendingEffect();return;
    case 'recycle':{
      let returned=[];for(let bi=0;bi<state.battle-1;bi++){returned.push(...(p.playedStacks[bi]||[]));p.playedStacks[bi]=[]}
      const ids=new Set(returned.map(x=>x.id));p.playHistory=(p.playHistory||[]).filter(x=>!ids.has(x.id));p.plays=shuffle([...p.plays,...returned]);drawPlays(p,2);finish(`${card.name}: shuffled ${returned.length} previously used Plays back into the Playbook • drew 2.`);return}
    case 'pressyourluck':{let rolls=[],drawn=0;while(true){const r=await rollDieSmart(state.active,n=>n>=4);rolls.push(r);if(r>=4){drawPlays(p,1);drawn++;continue}break}finish(`${card.name}: rolled ${rolls.join(', ')} • drew ${drawn} Play${drawn===1?'':'s'}.`);return}
    case 'secondwind':{const hc=p.heroDiscard.splice(0),pc=p.playDiscard.splice(0);p.heroes=shuffle([...p.heroes,...hc]);p.plays=shuffle([...p.plays,...pc]);drawPlays(p,2);finish(`${card.name}: shuffled ${hc.length} Heroes and ${pc.length} Plays from discard back into their decks • drew 2 Plays.`);return}
    case 'purgeandpatch':{const lost=opp.bench.length+opp.playHand.length;opp.heroDiscard.push(...opp.bench);opp.playDiscard.push(...opp.playHand);opp.bench=[];opp.playHand=[];opp.battlePower=Math.max(0,opp.battlePower-lost*5);drawPlays(opp,2);drawHeroes(opp,2);finish(`${card.name}: opponent discarded ${lost} hand cards • Hero -${lost*5} • drew 2 Plays and 2 Heroes.`);return}
    case 'freeplay':{if(!freePlaySearch(p,card,idx,cost,3)){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,p.dogsSpentThisBattle-cost);$('#battleMessage').innerHTML='<span class="play-toast">Free Play found no Play costing 3 HD or less.</span>'}return}
    case 'rollingreset':p.effects.rollingReset=true;finish(`${card.name}: you may re-roll one unwanted result each time you roll a die for the rest of the game.`);return;
    case 'sacrificeitalltowin':p.battlePower=0;if(state.battle<7)p.effects.firstPlayFreeBattle=state.battle+1;finish(`${card.name}: current Hero Power is 0${state.battle<7?` • first Play in Battle ${state.battle+1} is free`:''}.`);return;
    case 'sacrificeandscheme': drawPlays(p,2);commitPlay(p,card,idx);startPending('hero',2,card,{optional:true});refreshAfterPlay(`${card.name}: drew 2 Plays. You may now discard up to 2 Heroes.`);renderPendingEffect();return;
    case 'overflowtax': recoverDogs(state.active,3);commitPlay(p,card,idx);if(p.hotDogs>opp.hotDogs){startPending('play',1,card);refreshAfterPlay(`${card.name}: recovered 3 Hot Dogs. Now discard 1 Play.`);renderPendingEffect()}else refreshAfterPlay(`${card.name}: recovered 3 Hot Dogs.`);return;
    case 'doggoneflip':{const c=await tossCoin();const intended=c==='heads'?state.active:1-state.active;const actual=recoverDogs(intended,3);const redirected=actual!==intended?` Grilled Bandit redirects that recovery to Player ${actual+1}.`:'';finish(`${card.name}: ${c.toUpperCase()} • Player ${intended+1} would recover 3 Hot Dogs.${redirected}`);return}
    case '10perplay':{const bonus=p.playsRunThisBattle*10;p.battlePower+=bonus;finish(`${card.name}: +${bonus} Power from ${p.playsRunThisBattle} earlier Play(s).`);return}
    case 'fallenfighters':commitPlay(p,card,idx);startPending('hero',1,card,{after:'fallen'});refreshAfterPlay(`${card.name}: discard 1 Hero to calculate the bonus.`);renderPendingEffect();return;
    case 'updog':{if(p.hotDogs<opp.hotDogs){recoverDogs(state.active,2);drawPlays(p,1);msg+=': you recovered 2 Hot Dogs and drew 1 Play.'}else if(opp.hotDogs<p.hotDogs){recoverDogs(1-state.active,2);drawPlays(opp,1);msg+=`: Player ${2-state.active} recovered 2 Hot Dogs and drew 1 Play.`}else msg+=': Hot Dogs are tied, so no player has fewer.';finish(msg);return}
    case 'steelcrew':{const n=p.arena.slice(0,state.battle).filter(h=>h&&h.weapon==='STEEL').length;p.battlePower+=n*10;finish(`${card.name}: +${n*10} Power (${n} Steel Hero${n===1?'':'es'} used).`);return}
    case 'deadlinedeal':{const a=p.battlePower;p.battlePower=opp.battlePower;opp.battlePower=a;finish(`${card.name}: current Hero powers swapped.`);return}
    case 'doggoneinflation':opp.effects.inflationThrough=Math.max(opp.effects.inflationThrough,state.battle+1);finish(`${card.name}: opponent Plays cost +2 HD in Battles ${state.battle} and ${state.battle+1}.`);return;
    case 'steeldefense':if(p.arena[state.battle-1].weapon==='STEEL'){opp.effects.blockedBattle=state.battle;finish(`${card.name}: opponent cannot run Plays this Battle.`)}else finish(`${card.name}: no effect because your Hero is not Steel.`);return;
    case 'deepintheplaybook':state.deepPlaybook=true;finish(`${card.name}: dice rolls now draw a Play for the roller for the rest of the game.`);return;
    case 'qbsneak':p.effects.qbSneakBattle=state.battle;if(p.battlePower===opp.battlePower)p.battlePower+=1;finish(`${card.name}: +1 if the Battle is tied.`);return;
    case 'nastyo rnada': break;
    case 'nastyornada':{const rolls=[await rollDieSmart(state.active,n=>currentGameMode().lowWins?n!==6:n===6),await rollDieSmart(state.active,n=>currentGameMode().lowWins?n!==6:n===6),await rollDieSmart(state.active,n=>currentGameMode().lowWins?n!==6:n===6)];if(rolls.includes(6))p.battlePower+=30;finish(`${card.name}: rolled ${rolls.join(', ')}${rolls.includes(6)?' • +30 Power':''}.`);return}
    case 'worththerisk':{const r=await rollDieSmart(state.active,n=>currentGameMode().lowWins?(n===1||n===6):(n>=2&&n<=5));if(r===1||r===6)p.battlePower=0;else p.battlePower+=25;finish(`${card.name}: rolled ${r} • ${r===1||r===6?'Power drops to 0':'+25 Power'}.`);return}
    case 'riskydraw':{const c=await tossCoin();if(c==='heads'){drawPlays(p,2);finish(`${card.name}: HEADS • drew 2 Plays.`)}else{p.battlePower-=10;finish(`${card.name}: TAILS • Hero -10 Power.`)}return}
    case 'transferportal':{p.battlePower=Math.max(0,p.battlePower-30);p.effects.nextPowerBattle=state.battle+1;p.effects.nextPowerAmount=(p.effects.nextPowerAmount||0)+30;finish(`${card.name}: current Hero -30 Power • your Battle ${state.battle+1} Hero gets +30.`);return}
    case 'highstakespumpup':{p.battlePower+=10;p.effects.highStakesBattle=state.battle;finish(`${card.name}: current Hero +10 Power • if you lose, your next Battle Hero gets -20.`);return}
    case 'restrictedlist':{opp.effects.restrictedBattle=state.battle+1;opp.effects.restrictedBy=state.active;finish(`${card.name}: opponent may run a maximum of 1 Play in Battle ${state.battle+1}. You are not restricted.`);return}
    case 'diceduel':{const [mine,theirs]=await showDiceDuelRandomizer(state.active,1-state.active);if(mine>theirs){p.battlePower+=25;finish(`${card.name}: Player ${state.active+1} rolled ${mine}, Player ${2-state.active} rolled ${theirs} • Player ${state.active+1} Hero +25 Power.`)}else if(theirs>mine){opp.battlePower+=25;finish(`${card.name}: Player ${state.active+1} rolled ${mine}, Player ${2-state.active} rolled ${theirs} • Player ${2-state.active} Hero +25 Power.`)}else{p.battlePower-=10;opp.battlePower-=10;finish(`${card.name}: both rolled ${mine} • both Heroes -10 Power.`)}return}
    case '1for10':{drawPlays(p,1);p.battlePower-=10;finish(`${card.name}: drew 1 Play • Hero -10 Power.`);return}
    case 'tradeblows':{p.battlePower-=10;opp.battlePower-=10;drawPlays(p,1);drawPlays(opp,1);finish(`${card.name}: both Heroes -10 Power • both Players drew 1 Play.`);return}
    case 'momentumbreaker':{opp.battlePower-=5;if(opp.playHand.length){const ri=Math.floor(Math.random()*opp.playHand.length);const [d]=opp.playHand.splice(ri,1);opp.playDiscard.push(d)}finish(`${card.name}: opponent Hero -5 Power${opp.playDiscard.length?' • opponent discarded 1 random Play':''}.`);return}
    case 'overwhelm':{let n=Math.min(2,opp.playHand.length);for(let j=0;j<n;j++){const ri=Math.floor(Math.random()*opp.playHand.length);const [d]=opp.playHand.splice(ri,1);opp.playDiscard.push(d)}finish(`${card.name}: opponent discarded ${n} random Play${n===1?'':'s'}.`);return}
    case 'mutuallyassureddogstruction':{p.hotDogs=Math.max(0,p.hotDogs-2);opp.hotDogs=Math.max(0,opp.hotDogs-2);finish(`${card.name}: both Players discarded up to 2 Hot Dogs.`);return}
    case 'lowturnover':{if(p.heroDiscard.length===0)p.battlePower+=15;finish(`${card.name}: ${p.heroDiscard.length===0?'+15 Power':'no effect; your Hero discard pile is not empty'}.`);return}
    case 'highturnover':{if(p.heroDiscard.length>=3)p.battlePower+=25;finish(`${card.name}: ${p.heroDiscard.length>=3?'+25 Power':'no effect; fewer than 3 Heroes are discarded'}.`);return}
    case 'strengthinnumbers':{const b=(p.bench.length+p.playHand.length)*5;p.battlePower+=b;finish(`${card.name}: ${p.bench.length+p.playHand.length} cards in hand • +${b} Power.`);return}
    case 'powerdrain':{const b=p.heroDiscard.length*5;opp.battlePower-=10;p.battlePower+=b;finish(`${card.name}: opponent Hero -10 • your Hero +${b} from ${p.heroDiscard.length} discarded Heroes.`);return}
    case 'unifiedfront':p.battlePower+=15;finish(`${card.name}: +15 Power${cost===0?' • cost reduced to 0':''}.`);return;
    case 'linedrive':{const r=await rollDie(state.active),b=(r===3||r===4)?40:5;p.battlePower+=b;finish(`${card.name}: rolled ${r} • +${b} Power.`);return}
    case 'discardedheroes':{const b=p.heroDiscard.length*10;p.battlePower+=b;finish(`${card.name}: +${b} Power from ${p.heroDiscard.length} discarded Hero(es).`);return}
    case 'grilledbandit':p.effects.grilledBandit=true;finish(`${card.name}: future opponent Hot Dog recovery is redirected to you.`);return;
    case 'luckofthedraw':{let a=await rollDie(state.active),b=await rollDie(1-state.active);while(a===b){a=await rollDie(state.active);b=await rollDie(1-state.active)}const winner=a>b?state.active:1-state.active,w=state.players[winner],top=w.plays.shift();if(top){top.freeOnce=true;w.playHand.push(top)}finish(`${card.name}: P${state.active+1} rolled ${a}, P${2-state.active} rolled ${b}. P${winner+1} gets the top Play free if able.`);return}
    case 'pickonsomeoneyourownsize':p.battlePower=opp.battlePower;finish(`${card.name}: your current Power is now ${p.battlePower}.`);return;
    case 'hagotcha':{const base=Number(p.arena[state.battle-1].power),delta=p.battlePower-base;opp.battlePower+=delta;finish(`${card.name}: your current Play-based Power change (${delta>=0?'+':''}${delta}) also applied to opponent.`);return}
    case 'quickdraw':{const n=state.battle<3?2:1;drawPlays(p,n);finish(`${card.name}: drew ${n} Play${n===1?'':'s'}.`);return}
    case 'lucky7':{const a=await rollDie(state.active),b=await rollDie(state.active);if(a+b===7){p.battlePower+=100;finish(`${card.name}: rolled ${a}+${b}=7 • +100 Power.`)}else{if(p.bench.length){const ri=Math.floor(Math.random()*p.bench.length);p.heroDiscard.push(p.bench.splice(ri,1)[0])}finish(`${card.name}: rolled ${a}+${b}=${a+b} • random Hero discarded.`)}return}
    case 'weaponlineage':{const w=p.arena[state.battle-1].weapon,n=p.heroDiscard.filter(h=>h.weapon===w).length;p.battlePower+=n*10;finish(`${card.name}: +${n*10} Power from ${n} discarded ${w} Hero(es).`);return}
    case 'rebuild':{const lost=state.battle>1&&state.battleResults[state.battle-2]===1-state.active;if(lost){p.heroDiscard.push(...p.bench);p.bench=[];drawHeroes(p,4);finish(`${card.name}: hand rebuilt with 4 new Heroes.`)}else finish(`${card.name}: no effect because you did not lose the previous Battle.`);return}
    case 'backfromthedumps':{const notes=[];for(let i=0;i<2;i++){const q=state.players[i],n=Math.min(3,10-q.hotDogs);if(n>0){const actual=recoverDogs(i,n);notes.push(actual===i?`P${i+1} recovered ${n}`:`P${i+1}'s ${n} recovery redirected to P${actual+1} by Grilled Bandit`)}}finish(`${card.name}: ${notes.join(' • ')||'no Hot Dogs available to recover'}.`);return}
    case 'bankedpower':{const bonus=p.hotDogs*5;p.battlePower+=bonus;finish(`${card.name}: ${p.hotDogs} Hot Dogs remaining • +${bonus} Power.`);return}
    case 'greedtax':{const had=p.hotDogs;recoverDogs(state.active,2);if(had>=6)p.battlePower-=20;finish(`${card.name}: recovered 2 Hot Dogs${had>=6?' • Hero -20 Power':''}.`);return}
    case 'weaponmastery':{const w=p.arena[state.battle-1].weapon,n=p.arena.slice(0,state.battle-1).filter(h=>h&&h.weapon===w).length;if(n>=3)p.battlePower+=20;finish(`${card.name}: ${n} previous ${w} Heroes${n>=3?' • +20 Power':' • requirement not met'}.`);return}
    case 'glowaway':{const i=p.bench.findIndex(h=>h.weapon==='GLOW');if(i>=0){p.heroDiscard.push(p.bench.splice(i,1)[0]);p.battlePower+=25;finish(`${card.name}: discarded a Glow Hero • +25 Power.`)}else finish(`${card.name}: no Glow Hero in hand to discard.`);return}
    case 'flashsale':p.effects.discountThrough=Math.max(p.effects.discountThrough,state.battle+1);finish(`${card.name}: your Plays cost 1 less HD in Battles ${state.battle} and ${state.battle+1}.`);return;
    case 'playbooster':{const n=p.playsRunThisBattle+1;drawPlays(p,n);finish(`${card.name}: drew ${n} Play${n===1?'':'s'}.`);return}
    case 'recyclefor5':{const n=p.heroDiscard.length+p.playDiscard.length,b=n*5;p.battlePower+=b;finish(`${card.name}: ${n} discarded non-Hot-Dog cards • +${b} Power.`);return}
    case 'heavyhanded':{const b=opp.playHand.length*5;opp.battlePower-=b;finish(`${card.name}: opponent has ${opp.playHand.length} Plays • -${b} Power.`);return}
    case 'synergysnacks':{const prev=p.arena.slice(Math.max(0,state.battle-3),state.battle-1).filter(Boolean);if(prev.length===2&&prev[0].weapon===prev[1].weapon){recoverDogs(state.active,2);finish(`${card.name}: previous 2 Heroes match • recovered 2 Hot Dogs.`)}else finish(`${card.name}: previous 2 Heroes do not share a weapon.`);return}
    case 'overplayed':{const n=opp.playsRunThisBattle;if(n>1){opp.battlePower-=n*10;finish(`${card.name}: opponent has run ${n} Plays • -${n*10} Power.`)}else finish(`${card.name}: opponent has not run more than 1 Play.`);return}
    case '2for20':drawPlays(p,2);p.battlePower-=20;finish(`${card.name}: drew 2 Plays • Hero -20 Power.`);return;
    case 'onlyupside':{let pick=state.computerMode&&state.active===1?(1+Math.floor(Math.random()*6)):Number(prompt('Pick a number from 1 to 6','3'));if(!(pick>=1&&pick<=6))pick=3;const r=await rollDie(state.active);if(r===pick)p.battlePower+=20;else drawPlays(p,1);finish(`${card.name}: picked ${pick}, rolled ${r} • ${r===pick?'+20 Power':'drew 1 Play'}.`);return}
    case 'crystalball':{let mine=(state.computerMode&&state.active===1)?(1+Math.floor(Math.random()*6)):Number(prompt('Player '+(state.active+1)+': pick a number 1–6','3'));if(!(mine>=1&&mine<=6))mine=3;let theirs=(state.computerMode&&state.active===0)?(()=>{const a=[1,2,3,4,5,6].filter(n=>n!==mine);return a[Math.floor(Math.random()*a.length)]})():Number(prompt('Player '+(2-state.active)+': pick a DIFFERENT number 1–6','4'));if(!(theirs>=1&&theirs<=6)||theirs===mine)theirs=mine===4?5:4;const r=await rollDieSmart(state.active,n=>currentGameMode().lowWins?n!==mine:n===mine);if(r===mine)p.battlePower+=30;if(r===theirs)opp.battlePower+=30;finish(`${card.name}: picks ${mine} / ${theirs}, rolled ${r}${r===mine?' • your Hero +30':r===theirs?' • opponent Hero +30':' • no bonus'}.`);return}
    case 'oppschoice':{const old=p.arena[state.battle-1];p.heroDiscard.push(old);const choices=p.heroes.splice(0,Math.min(2,p.heroes.length));if(!choices.length){finish(`${card.name}: Hero discarded; Hero Deck empty.`);return}let pick=0;if(choices.length>1){if(state.computerMode&&state.active===0){pick=Number(choices[1].power||0)<Number(choices[0].power||0)?1:0}else{const ans=prompt(`Opponent chooses replacement: 1 = ${choices[0].power} ${choices[0].weapon}, 2 = ${choices[1].power} ${choices[1].weapon}`,'1');pick=ans==='2'?1:0}}const chosen=choices.splice(pick,1)[0];p.arena[state.battle-1]=chosen;p.battlePower=Number(chosen.power);p.heroDiscard.push(...choices);finish(`${card.name}: opponent chose ${chosen.power} ${chosen.weapon}.`);return}

    case 'itsgonnacostya':{p.battlePower-=15;recoverDogs(state.active,2);finish(`${card.name}: Hero -15 Power • recovered up to 2 Hot Dogs.`);return}
    case 'noblesacrifice':{p.battlePower=0;p.effects.permanentPowerBonus=(p.effects.permanentPowerBonus||0)+10;finish(`${card.name}: current Hero Power is 0 • future Heroes get +10 for the rest of the Game.`);return}
    case 'freebooster':{if(state.battle===1){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,(p.dogsSpentThisBattle||0)-cost);$('#battleMessage').innerHTML=`<span class="play-toast">${escapeHTML(card.name)} cannot be used in Battle 1.</span>`;return}p.battlePower+=20;finish(`${card.name}: +20 Power.`);return}
    case 'cheaptrick':{const top=p.plays.shift();if(!top){finish(`${card.name}: Playbook is empty.`);return}if((Number(top.cost)||0)<=2){p.playHand.push(top);p.battlePower+=10;finish(`${card.name}: revealed ${top.name} (${top.cost} HD) • drew it and +10 Power.`)}else{p.plays=shuffle([top,...p.plays]);finish(`${card.name}: revealed ${top.name} (${top.cost} HD) • shuffled it back.`)}return}
    case 'makeupcall':p.effects.makeUpCallBattle=state.battle;finish(`${card.name}: if you lose Battle ${state.battle}, recover 1 Hot Dog.`);return;
    case 'polishedcomeback':{const eligible=p.heroDiscard.filter(h=>h.weapon==='STEEL');if(!eligible.length){finish(`${card.name}: no Steel Hero in your discard pile.`);return}chooseCards('Choose a Steel Hero','Swap your current Hero with a Steel Hero from your discard pile.',eligible,'hero',chosen=>{const old=p.arena[state.battle-1];p.heroDiscard=p.heroDiscard.filter(h=>h.id!==chosen.id);p.heroDiscard.push(old);p.arena[state.battle-1]=chosen;p.battlePower=Number(chosen.power)+(p.effects?.permanentPowerBonus||0);closeChoice();refreshAfterPlay(`${card.name}: swapped in ${chosen.power} ${chosen.weapon}.`)});commitPlay(p,card,idx);return}
    case 'scrapmetal':{const eligible=p.bench.filter(h=>h.weapon==='STEEL');if(!eligible.length){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,(p.dogsSpentThisBattle||0)-cost);$('#battleMessage').innerHTML='<span class="play-toast">Scrap Metal requires a Steel Hero in hand.</span>';return}const resolve=(chosen)=>{p.bench=p.bench.filter(h=>h.id!==chosen.id);p.heroDiscard.push(chosen);opp.battlePower-=10;closeChoice();commitPlay(p,card,idx);refreshAfterPlay(`${card.name}: discarded ${chosen.power} Steel • opponent Hero -10.`)};if(state.computerMode&&state.active===1)resolve(eligible.slice().sort((a,b)=>Number(a.power)-Number(b.power))[0]);else chooseCards('Discard a Steel Hero','Choose a Steel Hero from your hand to discard.',eligible,'hero',resolve);return}
    case 'thechampionslasso':{const n=opp.dogsSpentThisBattle||0;p.effects.lassoBattle=state.battle;recoverDogs(state.active,n);finish(`${card.name}: opponent has used ${n} Hot Dog${n===1?'':'s'} this Battle • recovered up to ${n}.`);return}
    case 'wildcardwager':{const top=p.plays.shift();if(!top){finish(`${card.name}: Playbook is empty.`);return}if((Number(top.cost)||0)<=1){top.freeOnce=true;p.playHand.push(top);finish(`${card.name}: drew ${top.name}; it may be played immediately for free.`)}else{p.playDiscard.push(top);finish(`${card.name}: drew ${top.name} (${top.cost} HD) • discarded it.`)}return}
    case 'fullcourtpress':opp.effects.blockedBattle=state.battle;finish(`${card.name}: opponent cannot run any Plays this Battle.`);return;
    case 'forcedretreat':{const old=opp.arena[state.battle-1];if(!opp.bench.length){finish(`${card.name}: opponent has no Hero in hand to replace the active Hero.`);return}const resolve=(chosen)=>{opp.heroDiscard.push(old);opp.bench=opp.bench.filter(h=>h.id!==chosen.id);opp.arena[state.battle-1]=chosen;opp.battlePower=Number(chosen.power)+(opp.effects?.permanentPowerBonus||0);closeChoice();finish(`${card.name}: opponent discarded the active Hero and replaced it from hand.`)};if(state.computerMode&&(1-state.active)===1){const low=currentGameMode().lowWins;const chosen=opp.bench.slice().sort((a,b)=>low?Number(a.power)-Number(b.power):Number(b.power)-Number(a.power))[0];resolve(chosen)}else chooseCards('Forced Retreat','Choose a Hero from your hand to replace your current Hero.',opp.bench,'hero',resolve);return}
    case 'stainlessflip':{const eligible=p.bench.filter(h=>h.weapon==='STEEL');if(!eligible.length){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,(p.dogsSpentThisBattle||0)-cost);$('#battleMessage').innerHTML='<span class="play-toast">Stainless Flip requires a Steel Hero in hand.</span>';return}const resolve=async(chosen)=>{p.bench=p.bench.filter(h=>h.id!==chosen.id);p.heroDiscard.push(chosen);closeChoice();const coin=await tossCoin();if(coin==='heads')p.battlePower+=25;finish(`${card.name}: discarded a Steel Hero • ${coin.toUpperCase()}${coin==='heads'?' • +25 Power':''}.`)};if(state.computerMode&&state.active===1)await resolve(eligible.slice().sort((a,b)=>Number(a.power)-Number(b.power))[0]);else chooseCards('Stainless Flip','Discard a Steel Hero from your hand, then flip a coin.',eligible,'hero',resolve);return}
    case 'metalmarch':p.effects.steelMarchStart=state.battle+1;p.effects.steelMarchThrough=Math.min(7,state.battle+3);finish(`${card.name}: Steel active Heroes get +10 for the next 3 Battles.`);return;
    case 'steelflipper':{const coin=await tossCoin();if(coin==='heads')p.battlePower+=10;const steel=p.arena[state.battle-1]?.weapon==='STEEL';if(steel)drawPlays(p,1);finish(`${card.name}: ${coin.toUpperCase()}${coin==='heads'?' • +10 Power':''}${steel?' • Steel Hero drew 1 Play':''}.`);return}
    case 'weaponsync':{const cur=p.arena[state.battle-1],prev=state.battle>1?p.arena[state.battle-2]:null;const synced=!!(cur&&prev&&cur.weapon===prev.weapon);if(synced)p.battlePower+=20;else drawPlaysFromEffect(p,1);finish(`${card.name}: ${synced?'previous and current Heroes share '+cur.weapon+' • +20 Power':'weapons do not match • drew 1 Play'}.`);return}
    case 'markedforpickup':{const top=p.plays.shift();if(!top){finish(`${card.name}: Playbook is empty.`);return}p.playDiscard.push(top);p.effects.markedPickupCardId=top.id;p.effects.markedPickupBattle=state.battle;finish(`${card.name}: ${top.name} sent face-up to the Discard Pile • it will be picked up after this Battle.`);return}
    case 'allornothing':{const coin=await tossCoin();const change=coin==='heads'?40:-40;p.battlePower=Math.max(0,(p.battlePower||0)+change);finish(`${card.name}: ${coin.toUpperCase()} • ${change>0?'+40':'-40'} Power${currentGameMode().lowWins?' (Lowball)':''}.`);return}
    case 'firstdraw':{const first=(p.playsRunThisBattle||0)===1;if(first)drawPlaysFromEffect(p,1);finish(`${card.name}: ${first?'first Play this Battle • drew 1 Play':'not the first Play this Battle • no draw'}.`);return}
    case 'nohuddle':{const ran=p.playHistory.some(x=>x.usedBattle===state.battle-1);if(ran)p.battlePower+=15;finish(`${card.name}: ${ran?'+15 Power':'no Play was run last Battle • no bonus'}.`);return}
    case 'consolationcombo':p.effects.consolationBattle=state.battle;finish(`${card.name}: if your Hero loses this Battle, draw 1 Play and recover 1 Hot Dog.`);return;
    case 'doublereplacement':{if(!p.bench.length){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,(p.dogsSpentThisBattle||0)-cost);$('#battleMessage').innerHTML='<span class="play-toast">Double Replacement requires a Hero in hand to discard.</span>';return}const resolve=(chosen)=>{p.bench=p.bench.filter(h=>h.id!==chosen.id);p.heroDiscard.push(chosen);drawHeroes(p,2);closeChoice();finish(`${card.name}: discarded 1 Hero and drew 2 new Heroes.`)};if(state.computerMode&&state.active===1)resolve(p.bench.slice().sort((a,b)=>Number(a.power)-Number(b.power))[0]);else chooseCards('Double Replacement','Discard 1 Hero from your hand. Then draw 2 new Heroes.',p.bench,'hero',resolve);return}
    case 'delayedrecovery':{const future=p.arena.map((h,i)=>({h,i})).filter(x=>x.h&&x.i>=state.battle);if(!future.length){p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,(p.dogsSpentThisBattle||0)-cost);$('#battleMessage').innerHTML='<span class="play-toast">Delayed Recovery requires an unrevealed Hero.</span>';return}const resolve=(chosen)=>{const target=future.find(x=>x.h.id===chosen.id);p.effects.delayedRecoveryBattle=target.i+1;closeChoice();finish(`${card.name}: Battle ${target.i+1} Hero will get -10 and recover 2 Hot Dogs when revealed.`)};if(state.computerMode&&state.active===1){const target=future.slice().sort((a,b)=>Number(a.h.power)-Number(b.h.power))[0];resolve(target.h)}else chooseCards('Delayed Recovery','Choose one unrevealed Hero. When revealed, it gets -10 and you recover 2 Hot Dogs.',future.map(x=>x.h),'hero',resolve);return}
    default:{if(tryQueuedDiscardPileResolver(card,p,idx,cost))return;if(resolveSimpleMasterPlay(card,p,opp,finish))return;p.hotDogs+=cost;p.dogsSpentThisBattle=Math.max(0,(p.dogsSpentThisBattle||0)-cost);const rule=masterPlayRule(card);$('#battleMessage').innerHTML=rule?`<span class="play-toast"><strong>${escapeHTML(card.name)}</strong> is in the master rules library, but its game logic has not been implemented yet.<br><small>${escapeHTML(rule.description)}</small></span>`:`<span class="play-toast">${escapeHTML(card.name)} is not in the master Play list.</span>`;return}
  }
}
runPlayCard=runPlayCardV34;

$('#heroDiscardBtn').addEventListener('click',()=>{const p=activePlayer();$('#discardTitle').textContent=`Player ${state.active+1} Hero Discard (${p.heroDiscard.length})`;const box=$('#discardCards');box.innerHTML='';if(!p.heroDiscard.length)box.innerHTML='<p class="sub">No Heroes discarded yet.</p>';else p.heroDiscard.slice().reverse().forEach(c=>{const e=heroEl(c);e.draggable=false;box.appendChild(e)});$('#discardModal').hidden=false});

// V3.5 refinements for cards that launch another Play.
runCheapAddition=function(p,card,idx,cost){
  if(p.plays.length<1){$('#battleMessage').innerHTML='<span class="play-toast">Your Playbook is empty.</span>';return}
  spendDogsForPlay(p,cost);const revealed=p.plays.splice(0,Math.min(5,p.plays.length));
  showChoiceModal(card,revealed,chosen=>{commitPlay(p,card,idx);p.playHand.push(chosen);const rest=revealed.filter(x=>x.id!==chosen.id);p.plays=shuffle([...rest,...p.plays]);$('#choiceModal').hidden=true;refreshAfterPlay(`${card.name}: ${chosen.name} added to your hand • ${rest.length} shuffled back.`)})
};
byAnyMeans=function(p,card,idx,cost){if(!p.plays.length)return;chooseCards('Search your Playbook','Choose any Play. It will run immediately for free.',p.plays,'play',chosen=>{spendDogsForPlay(p,cost);commitPlay(p,card,idx);p.plays=p.plays.filter(x=>x.id!==chosen.id);p.plays=shuffle(p.plays);chosen.freeOnce=true;p.playHand.push(chosen);closeChoice();refreshAfterPlay(`${card.name}: running ${chosen.name} for free.`);setTimeout(()=>runPlayCardV34(chosen.id),80)})};

// V3.13 final runner binding
runPlayCard=runPlayCardV34;

// V3.14 — Normal difficulty computer opponent (Player 2)
state.computerMode=false; state.computerDifficulty='normal'; state.aiBusy=false;
function isCPU(i){return state.computerMode&&i===1}
function buildLegalSpecDeckFor(weapon){let deck=[];for(const power of SPEC_POWERS){const pool=shuffle(uniqueEligible(weapon,power));if(pool.length<6)return null;deck.push(...pool.slice(0,6).map(c=>({id:uid('cpu-h'),power:c.power,weapon:c.weapon,hero:c.hero,variation:c.variation,treatment:c.treatment,cardNumber:c.cardNumber,inspiredBy:c.inspiredBy})))}return shuffle(deck)}
function initCPUControls(){const sel=$('#cpuWeapon');if(!sel)return;sel.innerHTML='';for(const w of SPEC_WEAPONS){const e=weaponEligibility(w);if(e.ok){const o=document.createElement('option');o.value=w;o.textContent=w;sel.appendChild(o)}}if(!sel.options.length){const o=document.createElement('option');o.textContent='No legal weapon deck available';o.disabled=true;sel.appendChild(o)}if([...sel.options].some(o=>o.value==='STEEL'))sel.value='STEEL'}
initCPUControls();
$('#cpuScrimBtn')?.addEventListener('click',()=>{const p1=state.players[0],weapon=$('#cpuWeapon').value,playName=$('#cpuPlayDeck').value,heroDeck=buildLegalSpecDeckFor(weapon),preset=(window.PLAY_PRESETS||{})[playName];const st=$('#cpuStatus');if(!p1.heroes||!p1.plays){st.className='status generator-warning';st.textContent='Player 1 needs both a 60-Hero deck and a 30-Play deck first.';return}if(!heroDeck||!preset){st.className='status generator-warning';st.textContent='Could not build the selected computer deck.';return}state.computerMode=true;state.players[1].heroes=heroDeck;state.players[1].plays=preset.map(c=>({...c,id:uid('cpu-p')}));updateSetup();st.className='status generator-good';st.textContent=`Normal AI ready • ${weapon} Heroes • ${playName}. Starting scrim…`;setTimeout(()=>$('#startBtn').click(),180)});

// Skip Player 2's manual Arena placement in computer mode.
$('#lockBtn').addEventListener('click',e=>{if(!state.computerMode||state.active!==0)return;e.stopImmediatePropagation();const human=state.players[0];if(human.arena.filter(Boolean).length!==7)return;const cpu=state.players[1];cpu.arena=shuffle(cpu.placementHand);cpu.placementHand=[];dealOpeningHands();state.openingActive=0;state.handoffMode='opening';show('openingHand');renderOpening()},true);

// CPU opening hand is private to the computer; only show Player 1's.
$('#openingDone').addEventListener('click',e=>{if(!state.computerMode||state.openingActive!==0)return;e.stopImmediatePropagation();show('ready')},true);

function aiChooseSubstitution(){if(!isCPU(state.subActive)||state.aiBusy)return;state.aiBusy=true;const p=state.players[1],current=p.arena[state.battle-1],low=currentGameMode().lowWins,best=p.bench.reduce((a,h,i)=>!a||(low?Number(h.power)<Number(a.h.power):Number(h.power)>Number(a.h.power))?{h,i}:a,null);let doSub=false;if(best&&p.hotDogs>=2){const gain=low?Number(current.power)-Number(best.h.power):Number(best.h.power)-Number(current.power);const late=state.battle>=5;doSub=gain>=(late?10:20)&&(late||p.hotDogs>=5)}$('#battleMessage').innerHTML='<span class="ai-thinking">Computer is considering substitution</span>';setTimeout(()=>{if(doSub)state.selectedSub=best.i;state.aiBusy=false;finishSubDecision(doSub)},650)}
const renderBattleHumanV314=renderBattle;
renderBattle=function(){renderBattleHumanV314();if(isCPU(state.subActive)){const sb=$('#subBench');if(sb)sb.innerHTML=`<div class="cpu-private-zone"><strong>Alpha AI Bench • ${state.players[1].bench.length} hidden</strong></div>`;const panel=$('#subPanel');if(panel)panel.style.visibility='hidden';$('#battleMessage').innerHTML='<span class="ai-thinking">Alpha AI is considering substitution</span>';setTimeout(()=>{if(panel)panel.style.visibility='visible';aiChooseSubstitution()},250)}};
const showBattleHandoffHumanV314=showBattleHandoff;
showBattleHandoff=function(){if(state.computerMode&&isCPU(state.subActive)){const panel=$('#subPanel');panel.style.display='none';$('#battleMessage').innerHTML='<span class="ai-thinking">Computer is considering substitution</span>';setTimeout(aiChooseSubstitution,300)}else showBattleHandoffHumanV314()};

function aiCardUtility(card){const p=state.players[1],opp=state.players[0];if(p.effects?.blockedBattle===state.battle)return -999;if(p.effects?.restrictedBattle===state.battle&&p.effects?.restrictedBy!==1&&(p.playsRunThisBattle||0)>=1)return -999;const gap=(opp.battlePower??0)-(p.battlePower??0),k=norm(card.name),cost=card.freeOnce?0:(Number(card.cost)||0)+(p.effects?.inflationThrough>=state.battle?2:0)-(p.effects?.discountThrough>=state.battle?1:0);if(cost>p.hotDogs)return-999;const base=18-cost*5;const map={bankedpower:Math.max(8,p.hotDogs*5-gap),greedtax:p.hotDogs<=7?24:4,weaponmastery:28,flashsale:state.battle<7?26:5,playbooster:22,recyclefor5:22,heavyhanded:18+opp.playHand.length*4,synergysnacks:20,overplayed:opp.playsRunThisBattle>1?32:2,'2for20':gap>20?8:20,overflowtax:p.hotDogs<=6?26:8,doggoneinflation:state.battle<7?30:14,'10perplay':p.playsRunThisBattle?24+p.playsRunThisBattle*6:4,updog:p.hotDogs<opp.hotDogs?28:5,steelcrew:26,deadlinedeal:gap>10?38:2,steeldefense:p.arena[state.battle-1]?.weapon==='STEEL'?35:0,deepintheplaybook:state.battle<=4?20:5,qbsneak:gap===0?30:2,nastyornada:gap>0?26:14,worththerisk:gap>=20?24:10,unifiedfront:28,linedrive:gap>0?28:16,discardedheroes:p.heroDiscard.length?20+p.heroDiscard.length*4:3,grilledbandit:state.battle<=4?24:8,pickonsomeoneyourownsize:gap>0?40:0,quickdraw:state.battle<3?30:18,weaponlineage:22,rebuild:state.battle>1&&state.battleResults[state.battle-2]===0?28:0,backfromthedumps:p.hotDogs<=7?24:8,fullcourtpress:state.battle<=6?34:26,forcedretreat:opp.battlePower>p.battlePower&&opp.bench.length?32:8,stainlessflip:p.bench.some(h=>h.weapon==='STEEL')?24:0,metalmarch:state.battle<=4?28:6,steelflipper:24,weaponsync:(state.battle>1&&p.arena[state.battle-2]?.weapon===p.arena[state.battle-1]?.weapon)?30:18,markedforpickup:p.plays.length?20:0,firstdraw:(p.playsRunThisBattle||0)===0?24:2,nohuddle:p.playHistory.some(x=>x.usedBattle===state.battle-1)?27:3,consolationcombo:24,doublereplacement:p.bench.length&&p.heroes.length>=2?20:0,delayedrecovery:state.battle<=5&&p.hotDogs<=7?23:5,scrapmetal:p.bench.some(h=>h.weapon==='STEEL')?26:0,thechampionslasso:(opp.dogsSpentThisBattle||0)>0?28:20,freebooster:state.battle>1?26:0,transferportal:currentGameMode().lowWins?34:8,highstakespumpup:currentGameMode().lowWins?2:18,restrictedlist:state.battle<7?24:0};return (map[k]??base)-cost*2}
async function aiPlayTurn(){if(!state.computerMode||state.active!==1||state.aiBusy)return;state.aiBusy=true;$('#playPhaseHelp').textContent='Normal AI is taking its Play opportunity.';let plays=0;while(plays<3&&!state.pendingEffect){const p=state.players[1],choices=p.playHand.map(c=>({c,u:aiCardUtility(c)})).filter(x=>x.u>=18).sort((a,b)=>b.u-a.u);if(!choices.length)break;const chosen=choices[0].c;$('#battleMessage').innerHTML=`<span class="ai-thinking">Computer is considering ${escapeHTML(chosen.name)}</span>`;await new Promise(r=>setTimeout(r,550));await runPlayCardV34(chosen.id);plays++;await new Promise(r=>setTimeout(r,350));if(state.pendingEffect)break}state.aiBusy=false;if(state.pendingEffect){$('#battleMessage').innerHTML+='<br><strong>Computer hit an interactive discard effect; resolve the highlighted requirement to continue.</strong>';return}if(state.turnOrder[0]===1){$('#battleMessage').innerHTML+=`<br><strong>Computer ${plays?'finished':'passed'}.</strong> Your Play opportunity begins.`;startPlayPhaseV34(0)}else{finishPlayPhaseForBattle()}}
const startPlayPhaseHumanV314=startPlayPhaseV34;
startPlayPhaseV34=function(playerIndex){startPlayPhaseHumanV314(playerIndex);if(isCPU(playerIndex))setTimeout(aiPlayTurn,450)};
startPlayPhase=startPlayPhaseV34;


// V3.21 — keep the computer's private cards hidden from the human player.
// The active/revealed Battle Hero remains visible because it is public information.
const renderBattleBenchV321Base=renderBattleBench;
renderBattleBench=function(){
  const box=$('#battleBench');
  if(state.computerMode&&state.active===1){
    box.innerHTML=`<div class="cpu-private-zone"><div class="cpu-card-backs">${state.players[1].bench.map(()=>'<div class="cpu-card-back hero-back">HERO</div>').join('')}</div><strong>Computer Bench • '+state.players[1].bench.length+' hidden</strong></div>`;
    return;
  }
  renderBattleBenchV321Base();
};
const renderBattlePlayHandV321Base=renderBattlePlayHand;
renderBattlePlayHand=function(){
  const box=$('#battlePlayHand');
  if(state.computerMode&&state.active===1){
    box.innerHTML=`<div class="cpu-private-zone"><div class="cpu-card-backs">${state.players[1].playHand.map(()=>'<div class="cpu-card-back play-back">PLAY</div>').join('')}</div><strong>Computer Play Hand • '+state.players[1].playHand.length+' hidden</strong></div>`;
    return;
  }
  renderBattlePlayHandV321Base();
};
// Do not announce the identity of a Play while the AI is merely considering it.
const aiPlayTurnV321Base=aiPlayTurn;
aiPlayTurn=async function(){
  if(!state.computerMode||state.active!==1||state.aiBusy)return;
  state.aiBusy=true;
  $('#playPhaseHelp').textContent='Normal AI is taking its Play opportunity. Its hand and Bench are hidden.';
  renderBattlePlayHand();renderBattleBench();
  let plays=0;
  while(plays<3&&!state.pendingEffect){
    const p=state.players[1],choices=p.playHand.map(c=>({c,u:aiCardUtility(c)})).filter(x=>x.u>=18).sort((a,b)=>b.u-a.u);
    if(!choices.length)break;
    const chosen=choices[0].c;
    $('#battleMessage').innerHTML='<span class="ai-thinking">Computer is considering a Play</span>';
    await new Promise(r=>setTimeout(r,550));
    await runPlayCardV34(chosen.id);
    plays++;
    await new Promise(r=>setTimeout(r,350));
    if(state.pendingEffect)break;
  }
  state.aiBusy=false;
  if(state.pendingEffect){$('#battleMessage').innerHTML+='<br><strong>Computer hit an interactive effect.</strong>';return}
  if(state.turnOrder[0]===1){$('#battleMessage').innerHTML+=`<br><strong>Computer ${plays?'finished':'passed'}.</strong> Your Play opportunity begins.`;startPlayPhaseV34(0)}else{finishPlayPhaseForBattle()}
};

// V3.16 — simplified Spec generator. No Hero checklist dependency.
const GAME_MODES={
  spec:{name:'Spec',lowWins:false,distribution:[[115,6],[120,6],[125,6],[130,6],[135,6],[140,6],[145,6],[150,6],[155,6],[160,6]],description:'60 Heroes • six at each Power from 115–160 • highest Power wins.'},
  lowball:{name:'Lowball',lowWins:true,distribution:[[115,6],[120,6],[125,6],[130,6],[135,6],[140,6],[145,6],[150,6],[155,6],[160,6]],description:'Spec deck setup • lowest Power wins each Battle • Power can never go below 0.'},
  apex:{name:'Apex',lowWins:false,distribution:[[155,6],[160,6],[165,6],[170,6],[175,6],[180,6],[185,6],[190,6],[195,6],[200,6]],description:'60 Heroes • six at each Power from 155–200 • highest Power wins.'},
  specplus:{name:'Spec+',lowWins:false,distribution:[[115,6],[120,6],[125,6],[130,6],[135,6],[140,6],[145,6],[150,6],[155,6],[160,6],[165,2],[170,2],[175,1],[180,1],[185,1],[190,1],[195,1],[200,1]],description:'70 Heroes • standard Spec 60 + two 165 + two 170 + one each 175–200 • highest Power wins.'}
};
function currentGameMode(){return GAME_MODES[state.gameMode]||GAME_MODES.spec}
function clampBattlePowers(){state.players.forEach(p=>{if(p.battlePower!=null)p.battlePower=Math.max(0,Number(p.battlePower)||0)})}
function buildSimpleGameDeck(weapon,prefix='hero'){
  const deck=[];
  for(const [power,count] of currentGameMode().distribution){for(let n=0;n<count;n++){const w=String(weapon).toUpperCase(),mvfree=n===0&&((w==='GLOW'&&power===135)||(w==='STEEL'&&power===130));deck.push({id:uid(prefix),power,weapon:w,hero:mvfree?'(MVFree)':'',mvfree});}}
  return shuffle(deck);
}
function buildSimpleSpecDeck(weapon,prefix='spec-h'){return buildSimpleGameDeck(weapon,prefix)}
buildLegalSpecDeckFor=function(weapon){return buildSimpleGameDeck(weapon,'cpu-h')};
function updateGameModeUI(){
  state.gameMode=$('#simpleGameMode')?.value||'spec';
  const m=currentGameMode(),d=$('#gameModeDescription');if(d)d.textContent=m.description;
  const st=$('#simpleSetupStatus');if(st){st.className='status';st.textContent=`${m.name} selected. Choose both decks, then start.`;}
  const lim=simplePlayLimits();
  [0,1].forEach(i=>{const note=$(`#simpleP${i+1}UploadName`);if(note&&!simpleCustomPlayDecks[i])note.textContent=lim.max===40?'Choose a 30–40 Play CSV.':'Choose a 30-Play CSV.';});
}
const simpleCustomPlayDecks=[null,null];
function fillSimpleSelects(){
  ['#simpleP1Weapon','#simpleP2Weapon'].forEach((id,ix)=>{const el=$(id);el.innerHTML=SPEC_WEAPONS.map(w=>`<option value="${w}">${w}</option>`).join('');el.value=ix===0?'GLOW':'STEEL';});
  const names=['Top 8 Deck','Top 8 Updated','Meta Deck 1','Meta Deck 2','Beat Jason','Training Deck','Lowball Deck 1','Lowball Deck 2','Vanilla Glow','Use My Own Deck'];
  ['#simpleP1Play','#simpleP2Play'].forEach((id,ix)=>{const el=$(id);el.innerHTML=names.map(n=>`<option value="${n}">${n}</option>`).join('');el.value=ix===0?'Top 8 Updated':'Meta Deck 1';});
}
function updateSimpleUploadUI(i){
  const own=$(`#simpleP${i+1}Play`).value==='Use My Own Deck';
  $(`#simpleP${i+1}UploadWrap`).hidden=!own;
}
function simplePlayLimits(){
  const mode=$('#simpleGameMode')?.value||state.gameMode||'spec';
  return (mode==='lowball'||mode==='specplus')?{min:30,max:40}:{min:30,max:30};
}
function parseSimplePlays(text){
  const rows=parseCSV(text);if(rows.length<2)throw Error('Play CSV needs a header and Play cards.');
  const h=rows[0].map(norm);let ni=h.findIndex(x=>x==='cardname'||x==='name'||x.includes('cardname'));let ai=h.findIndex(x=>x==='ability'||x==='effect'||x.includes('ability'));let ci=h.findIndex(x=>x==='hdcost'||x==='cost'||x.includes('hdcost'));if(ni<0)ni=0;
  const data=rows.slice(1).filter(r=>r.some(Boolean)), lim=simplePlayLimits();
  if(data.length<lim.min||data.length>lim.max)throw Error(lim.max===30?`Playbook has ${data.length} Plays. This format requires exactly 30.`:`Playbook has ${data.length} Plays. This format allows 30–40 Plays.`);
  return data.map((r,i)=>({id:uid('p'),name:(r[ni]||`Play ${i+1}`).trim(),ability:ai>=0?(r[ai]||'').trim():'',cost:ci>=0&&r[ci]!==''?Number(r[ci]):null}));
}
async function loadSimpleCustomCSV(i,file){
  const note=$(`#simpleP${i+1}UploadName`),lim=simplePlayLimits();
  if(!file){simpleCustomPlayDecks[i]=null;note.textContent=lim.max===40?'Choose a 30–40 Play CSV.':'Choose a 30-Play CSV.';return;}
  try{
    const cards=parseSimplePlays(await file.text());
    const names=new Set(cards.map(c=>norm(c.name)));
    if(names.size!==cards.length)throw Error('Your Play deck must contain unique Play names.');
    if(cards.some(c=>!Number.isFinite(c.cost)||c.cost<0))throw Error('Every Play needs a valid HD Cost.');
    simpleCustomPlayDecks[i]=cards;
    note.textContent=`Loaded ${file.name} • ${cards.length} Plays`;
    $('#simpleSetupStatus').className='status good';
    $('#simpleSetupStatus').textContent=`Player ${i+1} custom Play deck loaded.`;
  }catch(e){
    simpleCustomPlayDecks[i]=null;
    note.textContent=e.message;
    $('#simpleSetupStatus').className='status generator-warning';
    $('#simpleSetupStatus').textContent=`Player ${i+1}: ${e.message}`;
  }
}
function loadSimplePlayer(i){
  const weapon=$(`#simpleP${i+1}Weapon`).value, playName=$(`#simpleP${i+1}Play`).value,lim=simplePlayLimits();
  const src=playName==='Use My Own Deck'?simpleCustomPlayDecks[i]:(window.PLAY_PRESETS||{})[playName];
  if(playName==='Use My Own Deck'&&!src)throw Error(`Player ${i+1}: upload a valid ${lim.max===40?'30–40':'30'}-Play CSV first.`);
  if(!src||src.length<lim.min||src.length>lim.max)throw Error(`${playName} is not a valid ${lim.max===40?'30–40':'30'}-Play deck.`);
  state.players[i].heroes=buildSimpleGameDeck(weapon,`p${i+1}-h`);
  state.players[i].plays=src.map(c=>({...c,id:uid(`p${i+1}-p`)}));
}
function startSimpleMatch(computer,difficulty='normal'){
  try{
    loadSimplePlayer(0);loadSimplePlayer(1);state.computerMode=!!computer;state.computerDifficulty=computer?difficulty:'normal';state.pendingSimpleComputer=!!computer;updateSetup();
    $('#simpleSetupStatus').className='status good';$('#simpleSetupStatus').textContent='Decks ready. Choose whether Player 1 goes first or second.';
    $('#firstChoiceModal').hidden=false;
  }catch(e){$('#simpleSetupStatus').className='status generator-warning';$('#simpleSetupStatus').textContent=e.message;}
}
function confirmInitialOrder(first){state.initialFirst=first;state.honors=first;state.turnOrder=[first,1-first];$('#firstChoiceModal').hidden=true;const aiName=state.computerDifficulty==='alpha'?'Alpha AI':'Normal AI';$('#simpleSetupStatus').textContent=state.computerMode?`${aiName} scrim ready • Player 1 goes ${first===0?'first':'second'}. Dealing Heroes…`:`Match ready • Player 1 goes ${first===0?'first':'second'}. Dealing Heroes…`;$('#startBtn').click()}
$('#goFirstBtn')?.addEventListener('click',()=>confirmInitialOrder(0));
$('#goSecondBtn')?.addEventListener('click',()=>confirmInitialOrder(1));
fillSimpleSelects();
$('#simpleGameMode')?.addEventListener('change',updateGameModeUI);updateGameModeUI();
[0,1].forEach(i=>{
  $(`#simpleP${i+1}Play`).addEventListener('change',()=>updateSimpleUploadUI(i));
  $(`#simpleP${i+1}Upload`).addEventListener('change',e=>loadSimpleCustomCSV(i,e.target.files?.[0]||null));
  updateSimpleUploadUI(i);
});
$('#simpleTwoPlayerBtn').addEventListener('click',()=>startSimpleMatch(false));
$('#simpleScrimBtn').addEventListener('click',()=>startSimpleMatch(true,'alpha'));
$('#simpleAlphaScrimBtn')?.addEventListener('click',()=>startSimpleMatch(true,'alpha'));

// Normal AI resource discipline: preserve Hot Dogs early, loosen late, empty the tank when necessary.
const aiCardUtilityV315=aiCardUtility;
aiCardUtility=function(card){
  const p=state.players[1],opp=state.players[0];
  const cost=effectiveCost(card), base=aiCardUtilityV315(card);
  if(cost<=0)return base+4;
  const b=state.battle, remaining=p.hotDogs, score=state.scores[1]-state.scores[0];
  const reserveByBattle={1:8,2:7,3:6,4:4,5:2,6:1,7:0};
  const reserve=reserveByBattle[b]??0;
  const after=remaining-cost;
  let penalty=after<reserve?(reserve-after)*9:0;
  if(b<=2&&cost>=2)penalty+=8;
  if(b<=3&&p.playsRunThisBattle>=1)penalty+=8*cost;
  const gap=currentGameMode().lowWins?((p.battlePower??0)-(opp.battlePower??0)):((opp.battlePower??0)-(p.battlePower??0));
  if(gap>=35&&b<=4)penalty+=8; // don't chase bad early battles
  if((b>=6&&score<0)||b===7)penalty=Math.max(0,penalty-18);
  return base-penalty;
};

// V3.22 — CPU resolves mandatory Hero/Play discards without exposing its private hand.
function aiHeroDiscardIndex(p,pe){
  if(!p.bench.length)return -1;
  // Fallen Fighters gets value from matching discarded weapons. Prefer a low-Power Hero
  // whose weapon already has the strongest discard-pile support.
  if(pe&&pe.after==='fallen'){
    let best=-1,bestScore=-Infinity;
    p.bench.forEach((h,i)=>{
      const matches=p.heroDiscard.filter(x=>x.weapon===h.weapon).length;
      const score=matches*30-Number(h.power||0);
      if(score>bestScore){bestScore=score;best=i}
    });
    return best;
  }
  // Preserve stronger Bench options for future substitutions.
  let best=0;
  for(let i=1;i<p.bench.length;i++)if(Number(p.bench[i].power||0)<Number(p.bench[best].power||0))best=i;
  return best;
}
function aiPlayDiscardIndex(p){
  if(!p.playHand.length)return -1;
  // Discard the least useful card for the CPU's current public game state.
  let best=0,bestUtility=Infinity;
  p.playHand.forEach((c,i)=>{
    const u=aiCardUtility(c);
    if(u<bestUtility){bestUtility=u;best=i}
  });
  return best;
}
async function aiResolvePendingDiscards(){
  while(state.computerMode&&state.active===1&&state.pendingEffect){
    const pe=state.pendingEffect,p=state.players[1];
    $('#battleMessage').innerHTML=`<span class="ai-thinking">Computer is resolving ${escapeHTML(pe.card.name)}</span>`;
    await new Promise(r=>setTimeout(r,350));
    if(pe.type==='hero'){
      if(pe.optional){
        const payoff=(p.playHand||[]).some(c=>['fallenfighters','weaponlineage','discardedheroes','recyclefor5'].includes(norm(c.name)));
        const discarded=pe.count-pe.remaining;
        if(!payoff || discarded>=Math.min(2,p.bench.length+discarded)){completePending();break}
      }
      const i=aiHeroDiscardIndex(p,pe);
      if(i<0){state.pendingEffect=null;renderPendingEffect();break}
      const [h]=p.bench.splice(i,1);p.heroDiscard.push(h);
      if(pe.after==='fallen'&&!pe.weapon)pe.weapon=h.weapon;
      pe.remaining--;
    }else if(pe.type==='play'){
      const i=aiPlayDiscardIndex(p);
      if(i<0){state.pendingEffect=null;renderPendingEffect();break}
      const [c]=p.playHand.splice(i,1);c.usedBattle=state.battle;p.playDiscard.push(c);
      pe.remaining--;
    }else break;
    renderBattleBench();renderBattlePlayHand();renderPendingEffect();
    if(pe.remaining<=0){completePending();break}
  }
}

// Replace the V3.14 CPU Play loop so mandatory discard effects are completed by the CPU
// before it evaluates another Play or passes the turn.
aiPlayTurn=async function(){
  if(!state.computerMode||state.active!==1||state.aiBusy)return;
  state.aiBusy=true;$('#playPhaseHelp').textContent='Normal AI is taking its Play opportunity.';let plays=0;
  while(plays<3){
    if(state.pendingEffect){await aiResolvePendingDiscards();await new Promise(r=>setTimeout(r,250));continue}
    const p=state.players[1],choices=p.playHand.map(c=>({c,u:aiCardUtility(c)})).filter(x=>x.u>=18).sort((a,b)=>b.u-a.u);
    if(!choices.length)break;
    const chosen=choices[0].c;
    $('#battleMessage').innerHTML='<span class="ai-thinking">Computer is considering a Play</span>';
    await new Promise(r=>setTimeout(r,550));await runPlayCardV34(chosen.id);plays++;
    await new Promise(r=>setTimeout(r,350));
    if(state.pendingEffect)await aiResolvePendingDiscards();
  }
  state.aiBusy=false;
  if(state.turnOrder[0]===1){$('#battleMessage').innerHTML+=`<br><strong>Computer ${plays?'finished':'passed'}.</strong> Your Play opportunity begins.`;startPlayPhaseV34(0)}else finishPlayPhaseForBattle();
};

// V3.31 — BoBA-aware AI sequencing + Beat Jason challenge deck.
// Strategy supplied by Alpha Labs: payoff Plays are finishers; Deep In The Playbook
// turns dice Plays into draw engines; Dog Gone Inflation is strongest when acting first.
function aiHasPlayAnywhere(name){
  const p=state.players[1], key=norm(name);
  const zones=[p.playHand,p.plays,p.playDiscard,...(p.playedStacks||[])];
  return zones.some(z=>(z||[]).some(c=>norm(c.name)===key));
}
function aiDiceRollCount(card){
  const k=norm(card.name);
  const fixed={nastyornada:3,lucky7:2,diceduel:1,luckofthedraw:1,linedrive:1,worththerisk:1,onlyupside:1,crystalball:1};
  if(fixed[k])return fixed[k];
  const t=String(card.ability||card.text||'').toLowerCase();
  if(!/roll|die|dice/.test(t))return 0;
  if(/roll\s+(?:a|one|1)\s+(?:die|dice)/.test(t))return 1;
  const m=t.match(/roll\s+(\d+)/); return m?Math.max(1,Number(m[1])):1;
}
const aiCardUtilityV330Base=aiCardUtility;
aiCardUtility=function(card){
  let u=aiCardUtilityV330Base(card);
  const p=state.players[1],opp=state.players[0],k=norm(card.name),first=state.turnOrder?.[0]===1;
  const low=currentGameMode().lowWins;
  const gap=low?((p.battlePower??0)-(opp.battlePower??0)):((opp.battlePower??0)-(p.battlePower??0));
  const run=p.playsRunThisBattle||0;
  // Deep In The Playbook synergy: dice cards are draw engines, not merely power gambles.
  const deepActive=!!state.deepPlaybook;
  const deepInDeck=deepActive||aiHasPlayAnywhere('Deep In The Playbook');
  const rolls=aiDiceRollCount(card);
  if(deepInDeck&&rolls){u+=rolls*(deepActive?12:7);if(k==='nastyornada')u+=deepActive?18:10}
  // Payoff cards should be sequenced after other useful Plays.
  if(k==='playbooster'||k==='10perplay'){
    u+=run*10;
    const otherPlayable=p.playHand.some(c=>c.id!==card.id&&effectiveCost(c)<=p.hotDogs&&!['playbooster','10perplay'].includes(norm(c.name))&&aiCardUtilityV330Base(c)>=18);
    if(otherPlayable&&run<3)u-=28; // hold the finisher while there is setup left to run
    if(run>=2)u+=18;
  }
  // Inflation gets both windows when the CPU acts first; acting second wastes most of current Battle.
  if(k==='doggoneinflation'){
    u+=first?24:-18;
    if(first&&state.battle<=5)u+=8;
  }
  // Deep itself is much more valuable early when the deck contains multiple dice-roll cards.
  if(k==='deepintheplaybook'){
    const diceDensity=[...(p.plays||[]),...p.playHand].reduce((n,c)=>n+(aiDiceRollCount(c)>0?1:0),0);
    u+=Math.min(28,diceDensity*3)+(state.battle<=3?12:0);
  }
  // Avoid wasting paid power when already comfortably winning; chase more as the game gets critical.
  const cost=effectiveCost(card);
  if(gap<=-30&&cost>0&&state.battle<=4)u-=12;
  if((state.scores[1]===3||state.scores[0]===3||state.battle>=6)&&gap>0)u+=10;
  return u;
};
function aiSequencePriority(card){
  const k=norm(card.name),p=state.players[1],first=state.turnOrder?.[0]===1;
  if(k==='doggoneinflation'&&first)return 100;
  if(k==='deepintheplaybook'&&!state.deepPlaybook)return 92;
  if(k==='playbooster')return -80;
  if(k==='10perplay')return -70;
  if(state.deepPlaybook&&aiDiceRollCount(card))return 35+aiDiceRollCount(card)*5;
  return 0;
}
aiPlayTurn=async function(){
  if(!state.computerMode||state.active!==1||state.aiBusy)return;
  state.aiBusy=true;$('#playPhaseHelp').textContent='Normal AI is evaluating the Battle, resources, combos, and Play order.';let plays=0;
  // More than the old 3-Play ceiling is necessary for Booster / 10 Per Play combo lines.
  while(plays<8){
    if(state.pendingEffect){await aiResolvePendingDiscards();await new Promise(r=>setTimeout(r,220));continue}
    const p=state.players[1];
    let choices=p.playHand.map(c=>({c,u:aiCardUtility(c),seq:aiSequencePriority(c)})).filter(x=>x.u>=18&&effectiveCost(x.c)<=p.hotDogs);
    if(!choices.length)break;
    // Hold payoff finishers while another worthwhile setup Play remains.
    const setup=choices.filter(x=>!['playbooster','10perplay'].includes(norm(x.c.name)));
    if(setup.length)choices=setup;
    choices.sort((a,b)=>(b.seq-a.seq)||(b.u-a.u));
    const chosen=choices[0].c;
    $('#battleMessage').innerHTML='<span class="ai-thinking">Computer is considering a Play</span>';
    await new Promise(r=>setTimeout(r,450));await runPlayCardV34(chosen.id);plays++;
    await new Promise(r=>setTimeout(r,260));
    if(state.pendingEffect)await aiResolvePendingDiscards();
  }
  state.aiBusy=false;
  if(state.turnOrder[0]===1){$('#battleMessage').innerHTML+=`<br><strong>Computer ${plays?'finished':'passed'}.</strong> Your Play opportunity begins.`;startPlayPhaseV34(0)}else finishPlayPhaseForBattle();
};


// V3.33 — AI owns its own random decisions. Human only clicks randomizers for human-initiated effects.
const showRandomizerV332=showRandomizer;
showRandomizer=function(kind){
  if(!(state.computerMode&&state.active===1)) return showRandomizerV332(kind);
  return new Promise(resolve=>{
    const modal=$('#randomizerModal'),visual=$('#randomizerVisual'),title=$('#randomizerTitle'),help=$('#randomizerHelp'),btn=$('#randomizerBtn');
    const dieFaces=['⚀','⚁','⚂','⚃','⚄','⚅'],isDie=kind==='die';
    title.textContent=isDie?'Computer rolls the die':'Computer flips the coin';
    help.textContent='Computer is resolving its randomizer.';btn.textContent='COMPUTER ROLLING…';btn.disabled=true;
    visual.className='randomizer-visual'+(isDie?'':' coin');visual.textContent=isDie?'⚄':'COIN';modal.hidden=false;visual.classList.add('rolling');
    let ticks=0;const timer=setInterval(()=>{visual.textContent=isDie?dieFaces[Math.floor(Math.random()*6)]:(Math.random()<.5?'HEADS':'TAILS');if(++ticks>=8){clearInterval(timer);const result=isDie?1+Math.floor(Math.random()*6):(Math.random()<.5?'heads':'tails');visual.textContent=isDie?dieFaces[result-1]:result.toUpperCase();visual.classList.remove('rolling');help.textContent=isDie?`Computer rolled ${result}`:`Computer flipped ${result.toUpperCase()}`;setTimeout(()=>{modal.hidden=true;btn.disabled=false;resolve(result)},650)}},75);
  });
};
const showDiceDuelRandomizerV332=showDiceDuelRandomizer;
showDiceDuelRandomizer=function(playerA,playerB){
  if(!(state.computerMode&&state.active===1)) return showDiceDuelRandomizerV332(playerA,playerB);
  return new Promise(resolve=>{
    const modal=$('#randomizerModal'),visual=$('#randomizerVisual'),title=$('#randomizerTitle'),help=$('#randomizerHelp'),btn=$('#randomizerBtn'),faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
    title.textContent='Dice Duel';help.textContent='Computer is rolling both dice.';btn.textContent='COMPUTER ROLLING…';btn.disabled=true;visual.className='randomizer-visual dice-duel rolling';visual.innerHTML='<span>⚄</span><b>VS</b><span>⚄</span>';modal.hidden=false;
    let ticks=0;const timer=setInterval(()=>{visual.innerHTML=`<span>${faces[Math.floor(Math.random()*6)]}</span><b>VS</b><span>${faces[Math.floor(Math.random()*6)]}</span>`;if(++ticks>=10){clearInterval(timer);const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);visual.innerHTML=`<span>${faces[a-1]}</span><b>VS</b><span>${faces[b-1]}</span>`;visual.classList.remove('rolling');help.textContent=`Player ${playerA+1}: ${a} • Player ${playerB+1}: ${b}`;setTimeout(()=>{modal.hidden=true;btn.disabled=false;visual.className='randomizer-visual';resolve([a,b])},650)}},75);
  });
};

// V3.35 — inspect the currently selected Play Deck from the main setup screen.
(function initPlayDeckViewerV334(){
  const viewer=document.querySelector('#playDeckViewer');
  const title=document.querySelector('#deckViewerTitle');
  const meta=document.querySelector('#deckViewerMeta');
  const body=document.querySelector('#deckViewerBody');
  const close=document.querySelector('#closeDeckViewer');
  if(!viewer||!title||!meta||!body||!close)return;
  function deckForPlayer(i){
    const select=document.querySelector(`#simpleP${i+1}Play`);
    const name=select?.value||'';
    const cards=name==='Use My Own Deck' ? simpleCustomPlayDecks[i] : (window.PLAY_PRESETS||{})[name];
    return {name,cards};
  }
  function openViewer(i){
    const {name,cards}=deckForPlayer(i);
    title.textContent=name||'Selected Play Deck';
    body.innerHTML='';
    if(!cards||!cards.length){
      meta.textContent=name==='Use My Own Deck'?'Upload your custom Play Deck first.':'No Play Deck is loaded.';
      body.innerHTML='<tr><td colspan="2">No Plays to display.</td></tr>';
    }else{
      meta.textContent=`Player ${i+1} • ${cards.length} Plays`;
      cards.forEach(card=>{
        const tr=document.createElement('tr');
        const nameCell=document.createElement('td');
        const costCell=document.createElement('td');
        nameCell.textContent=card.name||'Unnamed Play';
        costCell.textContent=Number.isFinite(Number(card.cost))?String(Number(card.cost)):'—';
        tr.append(nameCell,costCell);body.appendChild(tr);
      });
    }
    viewer.hidden=false;
    close.focus();
  }
  function closeViewer(){viewer.hidden=true;}
  document.querySelector('#simpleP1SeeDeck')?.addEventListener('click',()=>openViewer(0));
  document.querySelector('#simpleP2SeeDeck')?.addEventListener('click',()=>openViewer(1));
  close.addEventListener('click',closeViewer);
  viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!viewer.hidden)closeViewer();});
})();


// V3.40 — Alpha AI strategic layer. Normal AI remains available unchanged.
function aiIsAlpha(){return state.computerMode&&state.computerDifficulty==='alpha'}
function aiCriticalBattle(){return state.scores[1]===3||state.scores[0]===3||state.battle>=6}
function aiCpuLeading(){const p=state.players[1],opp=state.players[0],low=currentGameMode().lowWins;return low?(p.battlePower??0)<(opp.battlePower??0):(p.battlePower??0)>(opp.battlePower??0)}
function aiCpuHasHonors(){return state.turnOrder?.[0]===1}
function aiRecoverable(i,n=3){return Math.max(0,Math.min(n,10-(state.players[i]?.hotDogs??10)))}
function aiRecoverySupportScore(){
  const p=state.players[1], cards=[...(p.playHand||[]),...(p.plays||[])], keys=cards.map(c=>norm(c.name));
  let v=0;
  if(keys.includes('doggoneflip'))v+=22;
  if(keys.includes('backfromthedumps'))v+=28;
  if(keys.includes('updog'))v+=8;
  if(keys.includes('overflowtax'))v+=10;
  if(keys.includes('greedtax'))v+=8;
  return v;
}
function aiDeepInHand(){return state.players[1].playHand.some(c=>norm(c.name)==='deepintheplaybook')}
function aiReloadTargetScore(card){
  const k=norm(card.name),p=state.players[1],opp=state.players[0];
  let v=aiCardUtilityV330Base?aiCardUtilityV330Base(card):20;
  if(k==='doggoneinflation')v+=aiCpuHasHonors()?45:15;
  if(k==='backfromthedumps'){
    const own=aiRecoverable(1,3), theirs=aiRecoverable(0,3);
    v+=own*7+(p.effects?.grilledBandit?theirs*10:theirs*2);
  }
  if(k==='playbooster')v+=(p.playsRunThisBattle||0)*12;
  if(k==='nastyornada')v+=state.deepPlaybook?55:(aiCriticalBattle()?25:8);
  if(k==='deepintheplaybook'&&!state.deepPlaybook)v+=state.battle<=4?45:15;
  if(k==='grilledbandit'&&!p.effects?.grilledBandit)v+=aiRecoverySupportScore();
  if(k==='steeldefense')v+=(aiCpuHasHonors()&&aiCpuLeading())?40:-80;
  return v;
}
const choosePlayFromDiscardV340Base=choosePlayFromDiscard;
choosePlayFromDiscard=function(p,card,idx,cost){
  if(!(aiIsAlpha()&&state.active===1))return choosePlayFromDiscardV340Base(p,card,idx,cost);
  const eligible=(p.playedStacks||[]).slice(0,state.battle-1).flat();
  if(!eligible.length){$('#battleMessage').innerHTML='<span class="play-toast">No Play used in a previous Battle is available.</span>';return}
  const chosen=eligible.slice().sort((a,b)=>aiReloadTargetScore(b)-aiReloadTargetScore(a))[0];
  p.hotDogs-=cost;p.dogsSpentThisBattle=(p.dogsSpentThisBattle||0)+cost;commitPlay(p,card,idx);
  for(const stack of p.playedStacks){const di=stack.findIndex(x=>x.id===chosen.id);if(di>=0){p.playHand.push(stack.splice(di,1)[0]);break}}
  renderPlayedStacks();refreshAfterPlay(`${card.name}: Computer recovered a previous high-impact Play.`);
};
const aiCardUtilityV340Normal=aiCardUtility;
aiCardUtility=function(card){
  let u=aiCardUtilityV340Normal(card);
  if(!aiIsAlpha())return u;
  const p=state.players[1],opp=state.players[0],k=norm(card.name),rolls=aiDiceRollCount(card),critical=aiCriticalBattle();
  const low=currentGameMode().lowWins;
  const gap=low?((p.battlePower??0)-(opp.battlePower??0)):((opp.battlePower??0)-(p.battlePower??0));
  // Deep in hand: preserve dice-roll Plays for the draw engine unless the current Battle warrants using them now.
  if(!state.deepPlaybook&&aiDeepInHand()&&rolls&&k!=='deepintheplaybook'){
    let hold=22+rolls*5;
    if(critical)hold-=16;
    if(gap>=25)hold-=12;
    if(k==='nastyornada'&&(critical||state.battle>=5))hold-=12;
    u-=Math.max(0,hold);
  }
  // Nasty remains a legitimate +30 gamble later even without Deep.
  if(k==='nastyornada'&&!state.deepPlaybook&&!aiDeepInHand()){
    if(state.battle>=5)u+=14;
    if(critical)u+=16;
    if(gap>0&&gap<=30)u+=12;
  }
  // Steel Defense only has strategic value when Alpha has Honors and is already ahead.
  if(k==='steeldefense'){
    const steel=p.arena[state.battle-1]?.weapon==='STEEL';
    if(!steel||!aiCpuHasHonors()||!aiCpuLeading())return -999;
    u+=45+(critical?12:0);
  }
  // Grilled Bandit changes the recovery economy. Prefer it when Alpha has recovery support and both players have spent HD.
  if(k==='grilledbandit'){
    if(p.effects?.grilledBandit)return -999;
    const support=aiRecoverySupportScore(), oppSpent=10-opp.hotDogs, ownSpent=10-p.hotDogs;
    u+=support+Math.min(24,oppSpent*4)+Math.min(12,ownSpent*2);
    if(state.battle<=4)u+=12;
  }
  // Once Bandit is live, recovery cards are worth the recovery they steal as well as Alpha's own recovery.
  if(p.effects?.grilledBandit){
    if(k==='backfromthedumps')u+=aiRecoverable(1,3)*7+aiRecoverable(0,3)*10;
    if(k==='doggoneflip')u+=24+aiRecoverable(0,3)*6;
    if(['updog','overflowtax','greedtax'].includes(k))u+=10;
  }
  // Reload is only attractive when a meaningful target is available.
  if(k==='reload'){
    const eligible=(p.playedStacks||[]).slice(0,state.battle-1).flat();
    if(!eligible.length)return -999;
    const best=Math.max(...eligible.map(aiReloadTargetScore));
    u+=(best-20)*0.8;
  }
  // Resource discipline: Alpha is more willing to pass a battle that is far out of reach.
  const cost=effectiveCost(card);
  if(gap>=45&&!critical&&cost>0)u-=20;
  if(gap<=-25&&!critical&&cost>0)u-=10;
  return u;
};
const aiSequencePriorityV340Normal=aiSequencePriority;
aiSequencePriority=function(card){
  let s=aiSequencePriorityV340Normal(card);
  if(!aiIsAlpha())return s;
  const k=norm(card.name),p=state.players[1];
  if(k==='deepintheplaybook'&&!state.deepPlaybook)return 180;
  if(k==='steeldefense'&&aiCpuHasHonors()&&aiCpuLeading())return 170;
  if(k==='grilledbandit'&&!p.effects?.grilledBandit)return 145;
  if(k==='reload')return 55;
  if(state.deepPlaybook&&aiDiceRollCount(card))return 75+aiDiceRollCount(card)*8;
  return s;
};
const aiPlayTurnV340Normal=aiPlayTurn;
aiPlayTurn=async function(){
  if(!aiIsAlpha())return aiPlayTurnV340Normal();
  if(!state.computerMode||state.active!==1||state.aiBusy)return;
  state.aiBusy=true;$('#playPhaseHelp').textContent='Alpha AI is evaluating Battle value, Hot Dogs, combos, timing, and Play order.';let plays=0;
  while(plays<10){
    if(state.pendingEffect){await aiResolvePendingDiscards();await new Promise(r=>setTimeout(r,180));continue}
    const p=state.players[1];
    let choices=p.playHand.map(c=>({c,u:aiCardUtility(c),seq:aiSequencePriority(c)})).filter(x=>x.u>=20&&effectiveCost(x.c)<=p.hotDogs);
    if(!choices.length)break;
    // Booster / 10 Per Play are finishers. Keep running useful setup cards first.
    const setup=choices.filter(x=>!['playbooster','10perplay'].includes(norm(x.c.name)));
    if(setup.length)choices=setup;
    choices.sort((a,b)=>(b.seq-a.seq)||(b.u-a.u));
    const chosen=choices[0].c;
    $('#battleMessage').innerHTML='<span class="ai-thinking">Alpha AI is considering its best line</span>';
    await new Promise(r=>setTimeout(r,380));await runPlayCardV34(chosen.id);plays++;
    await new Promise(r=>setTimeout(r,220));
    if(state.pendingEffect)await aiResolvePendingDiscards();
  }
  state.aiBusy=false;
  if(state.turnOrder[0]===1){$('#battleMessage').innerHTML+=`<br><strong>Alpha AI ${plays?'finished':'passed'}.</strong> Your Play opportunity begins.`;startPlayPhaseV34(0)}else finishPlayPhaseForBattle();
};
// Dynamic AI label in the Play phase.
const startPlayPhaseV340Base=startPlayPhaseV34;
startPlayPhaseV34=function(playerIndex){
  startPlayPhaseV340Base(playerIndex);
  if(isCPU(playerIndex))$('#playPhaseHelp').textContent=state.computerDifficulty==='alpha'?'Alpha AI is taking its Play opportunity.':'Normal AI is taking its Play opportunity.';
};
startPlayPhase=startPlayPhaseV34;

// V3.41 — Alpha AI recovery awareness + dual Grilled Bandit lockout + marginal-value discipline.
// If both players have Grilled Bandit active, all Hot Dog recovery is blocked.
recoverDogs=function(playerIndex,n){
  const target=state.players[playerIndex];
  const requested=Math.max(0,Number(n)||0);
  const eligible=Math.max(0,Math.min(requested,10-target.hotDogs));
  if(eligible<=0)return playerIndex;
  const opponentIndex=1-playerIndex;
  const opponent=state.players[opponentIndex];
  const targetBandit=!!target.effects?.grilledBandit;
  const opponentBandit=!!opponent.effects?.grilledBandit;
  if(targetBandit&&opponentBandit)return -1; // recovery lock: nobody receives HD
  if(opponentBandit){
    opponent.hotDogs=Math.min(10,opponent.hotDogs+eligible);
    return opponentIndex;
  }
  target.hotDogs=Math.min(10,target.hotDogs+eligible);
  return playerIndex;
};

function aiOpponentBandit(){return !!state.players[0]?.effects?.grilledBandit}
function aiBothBandits(){return !!state.players[0]?.effects?.grilledBandit&&!!state.players[1]?.effects?.grilledBandit}
function aiPowerLead(){
  const p=state.players[1],opp=state.players[0],low=currentGameMode().lowWins;
  return low?((opp.battlePower??0)-(p.battlePower??0)):((p.battlePower??0)-(opp.battlePower??0));
}
function aiRecoveryOnlyKey(k){return ['backfromthedumps','trashbandit','synergysnacks','greedtax'].includes(k)}
const aiCardUtilityV341Base=aiCardUtility;
aiCardUtility=function(card){
  let u=aiCardUtilityV341Base(card);
  if(!aiIsAlpha())return u;
  const k=norm(card.name),p=state.players[1],opp=state.players[0];
  const lead=aiPowerLead();

  // Opposing Grilled Bandit makes Alpha's recovery feed the opponent instead.
  // If both Bandits are live, recovery is completely locked for both players.
  if(aiBothBandits()){
    if(aiRecoveryOnlyKey(k)||k==='backfromthedumps'||k==='doggoneflip')return -999;
  }else if(aiOpponentBandit()){
    if(k==='backfromthedumps')return -999;
    if(aiRecoveryOnlyKey(k))return -999;
    // Dog Gone Flip is especially dangerous: either result can benefit the Bandit player.
    if(k==='doggoneflip')u-=90;
    if(k==='updog'&&p.hotDogs<opp.hotDogs)u-=70;
    if(k==='overflowtax')u-=70;
  }

  // Back From The Dumps must be evaluated as an actual recovery event, not a printed-value bonus.
  if(k==='backfromthedumps'){
    const own=aiRecoverable(1,3),theirs=aiRecoverable(0,3);
    if(p.effects?.grilledBandit&&!aiOpponentBandit())u+=own*5+theirs*9;
    else if(!p.effects?.grilledBandit&&!aiOpponentBandit())u+=own*5-theirs*4;
  }

  // Marginal-value discipline: don't spend a Play to pile on Power when the Battle is already comfortable.
  if(k==='heavyhanded'){
    const reduction=(opp.playHand?.length||0)*5;
    if(lead>=25)return -999;
    // Prefer it when the reduction can flip a deficit or protect a genuinely close Battle.
    if(lead<0&&reduction>=Math.abs(lead))u+=35;
    else if(lead>=0&&lead<15)u+=8;
    else u-=20;
  }
  return u;
};


// V3.42 — Alpha AI decision quality pass + optional decision log.
function alphaLogEnabled(){return !!document.querySelector('#alphaDecisionLogToggle')?.checked}
function alphaDecisionLog(message){
  if(!alphaLogEnabled())return;
  const panel=document.querySelector('#alphaDecisionLog'),body=document.querySelector('#alphaDecisionLogBody');
  if(!panel||!body)return;
  panel.hidden=false;
  const row=document.createElement('div');row.className='alpha-log-row';row.textContent=`Battle ${state.battle}: ${message}`;body.prepend(row);
  while(body.children.length>24)body.lastElementChild.remove();
}
function alphaBattleImportance(){
  const us=state.scores?.[1]||0,them=state.scores?.[0]||0;
  if(us===3||them===3||state.battle>=7)return 3;
  if(state.battle>=5||us===2||them===2)return 2;
  return 1;
}
function alphaPrintedPowerImpact(card){
  const k=norm(card.name),t=String(card.ability||card.text||'').toLowerCase();
  // Effects whose value is not captured by a simple printed +Power estimate stay null.
  if(['deadline deal','pick on someone your own size','ha! gotcha'].some(x=>t.includes(x)))return null;
  const vals=[...t.matchAll(/\+(\d+)/g)].map(m=>Number(m[1])).filter(Number.isFinite);
  if(!vals.length)return 0;
  return Math.max(...vals);
}
function alphaIsMostlyPowerPlay(card){
  const k=norm(card.name),t=String(card.ability||card.text||'').toLowerCase();
  if(['heavyhanded','nastyornada','linedrive','worththerisk','qb sneak','unifiedfront','10perplay','playbooster'].includes(k))return true;
  const hasPower=/hero.*(?:gets|gain|power)|\+\d+/.test(t);
  const strategic=/draw|recover|discard|search|shuffle|playbook|hot dog|can\'t run|cannot run|cost|rest of the game|swap|hand/.test(t);
  return hasPower&&!strategic;
}
function alphaPreCommitReason(card){
  const p=state.players[1],opp=state.players[0],k=norm(card.name),lead=aiPowerLead(),critical=alphaBattleImportance()>=3;
  // Never voluntarily feed an opposing Bandit with recovery.
  if(aiBothBandits()&&(aiRecoveryOnlyKey(k)||['backfromthedumps','doggoneflip','updog','overflowtax'].includes(k)))return 'recovery is locked because both Grilled Bandits are active';
  if(aiOpponentBandit()&&['backfromthedumps','doggoneflip','overflowtax'].includes(k))return `opponent's Grilled Bandit would turn the recovery against Alpha`;
  // Steel Defense is a lockout play, not a comeback play.
  if(k==='steeldefense'&&(!aiCpuHasHonors()||!aiCpuLeading()))return 'Steel Defense only makes sense with Honors while already leading';
  // Preserve dice cards for Deep when the engine is actually in hand, unless stakes justify firing now.
  if(!state.deepPlaybook&&aiDeepInHand()&&aiDiceRollCount(card)>0&&k!=='deepintheplaybook'&&!critical&&state.battle<=4&&lead>-30)return 'holding a dice Play for Deep In The Playbook';
  // Generic marginal-value guard. A comfortable lead should not be padded with a paid/valuable power-only card.
  const cost=effectiveCost(card),impact=alphaPrintedPowerImpact(card);
  if(alphaIsMostlyPowerPlay(card)&&lead>=35&&!critical){
    if(cost>0||impact>0)return `already leads by ${lead}; extra Power has low marginal value`;
  }
  // If hopelessly behind early, don't burn paid power unless the printed swing can plausibly close the gap.
  if(alphaIsMostlyPowerPlay(card)&&lead<=-55&&!critical&&cost>0&&impact!==null&&impact<Math.abs(lead)-15)return `trails by ${Math.abs(lead)} and this Play is unlikely to rescue the Battle`;
  return '';
}
const aiCardUtilityV342Base=aiCardUtility;
aiCardUtility=function(card){
  let u=aiCardUtilityV342Base(card);
  if(!aiIsAlpha())return u;
  const reason=alphaPreCommitReason(card);
  if(reason)return -999;
  const k=norm(card.name),p=state.players[1],lead=aiPowerLead(),importance=alphaBattleImportance();
  // Late-game Nasty remains live even without Deep: +30 can matter in close/deciding Battles.
  if(k==='nastyornada'&&!state.deepPlaybook&&!aiDeepInHand()){
    if(state.battle>=5)u+=8;
    if(importance>=2&&lead<25)u+=10;
  }
  // Grilled Bandit is stronger when Alpha can exploit the recovery economy after it lands.
  if(k==='grilledbandit'&&!p.effects?.grilledBandit){
    u+=Math.min(30,aiRecoverySupportScore());
    if(p.playHand.some(c=>['doggoneflip','backfromthedumps'].includes(norm(c.name))))u+=14;
  }
  return u;
};

const aiPlayTurnV342Base=aiPlayTurn;
aiPlayTurn=async function(){
  if(!aiIsAlpha())return aiPlayTurnV342Base();
  if(!state.computerMode||state.active!==1||state.aiBusy)return;
  state.aiBusy=true;$('#playPhaseHelp').textContent='Alpha AI is evaluating Battle value, Hot Dogs, combos, timing, and Play order.';let plays=0;
  while(plays<10){
    if(state.pendingEffect){await aiResolvePendingDiscards();await new Promise(r=>setTimeout(r,180));continue}
    const p=state.players[1];
    const evaluated=p.playHand.map(c=>({c,u:aiCardUtility(c),seq:aiSequencePriority(c),reason:alphaPreCommitReason(c),cost:effectiveCost(c)}));
    if(alphaLogEnabled()){
      evaluated.filter(x=>x.reason).slice(0,4).forEach(x=>alphaDecisionLog(`Held ${x.c.name}: ${x.reason}.`));
    }
    let choices=evaluated.filter(x=>!x.reason&&x.u>=20&&x.cost<=p.hotDogs);
    if(!choices.length){alphaDecisionLog(`Passed with ${p.hotDogs} HD; no Play cleared the value threshold.`);break}
    const setup=choices.filter(x=>!['playbooster','10perplay'].includes(norm(x.c.name)));
    if(setup.length)choices=setup;
    choices.sort((a,b)=>(b.seq-a.seq)||(b.u-a.u));
    const chosen=choices[0];
    alphaDecisionLog(`Ran ${chosen.c.name} (score ${Math.round(chosen.u)}, cost ${chosen.cost} HD, Power lead ${aiPowerLead()}).`);
    $('#battleMessage').innerHTML='<span class="ai-thinking">Alpha AI is considering its best line</span>';
    await new Promise(r=>setTimeout(r,380));await runPlayCardV34(chosen.c.id);plays++;
    await new Promise(r=>setTimeout(r,220));
    if(state.pendingEffect)await aiResolvePendingDiscards();
  }
  state.aiBusy=false;
  if(state.turnOrder[0]===1){$('#battleMessage').innerHTML+=`<br><strong>Alpha AI ${plays?'finished':'passed'}.</strong> Your Play opportunity begins.`;startPlayPhaseV34(0)}else finishPlayPhaseForBattle();
};

// V3.50 — Lowball Alpha AI: lowest Power is the objective.
// Alpha now evaluates Lowball cards for whether they improve the low-score position,
// preserves cards when they do not, and uses Bench substitutions to lower Power.
function alphaLowball(){return aiIsAlpha()&&currentGameMode().lowWins}
function alphaLowballLead(){
  const us=Number(state.players[1]?.battlePower??0), them=Number(state.players[0]?.battlePower??0);
  return them-us; // positive = Alpha is winning in Lowball
}
function alphaLowballUtility(card){
  if(!alphaLowball())return null;
  const p=state.players[1],opp=state.players[0],k=norm(card.name),us=Number(p.battlePower??0),them=Number(opp.battlePower??0);
  const lead=them-us,cost=effectiveCost(card),critical=alphaBattleImportance()>=3;
  if(cost>p.hotDogs)return -999;
  // Direct self-lowering cards are premium Lowball tools.

  if(k==='burnthetimeline')return (p.bench.some(h=>h.weapon==='FIRE')&&(state.deepPlaybook||opp.effects?.grilledBandit||p.effects?.permanentPowerBonus||opp.effects?.permanentPowerBonus))?55:-999;
  if(k==='emergencyshutdown')return p.hotDogs<=2&&(state.deepPlaybook||opp.effects?.grilledBandit||p.effects?.permanentPowerBonus||opp.effects?.permanentPowerBonus)?52:-999;
  if(k==='bigtimerecruit')return state.battle<=5?38-cost*4:18;
  if(k==='easychoice')return state.battle<7?32-cost*4:-999;
  if(k==='evenmoney')return lead<0?34:12;
  if(k==='tradeup')return p.playHand.length>=3?30-cost*4:8;
  if(k==='recycle')return state.battle>=3?36-cost*4:5;
  if(k==='pressyourluck')return state.deepPlaybook?46:30-cost*4;
  if(k==='secondwind')return (p.playDiscard.length+p.heroDiscard.length)>=4?38-cost*4:8;
  if(k==='flashsale')return state.battle<7&&p.playHand.length>=2?45-cost*4:15;
  if(k==='thechampionslasso')return (opp.dogsSpentThisBattle||0)>0?42:28;
  if(k==='overflowtax')return p.hotDogs<=7?38:10;
  if(k==='purgeandpatch')return opp.playHand.length+opp.bench.length>=5?28-cost*5:8;
  if(k==='freeplay')return p.plays.some(x=>(Number(x.cost)||0)<=3)?48-cost*4:-999;
  if(k==='rollingreset')return state.battle<=5?44-cost*4:24;
  if(k==='sacrificeitalltowin')return us>0?125-cost*5:-999;
  if(k==='noblesacrifice')return us>0 ? 115-cost*5 : -999;
  if(k==='transferportal'){
    const now=Math.min(30,us), after=us-now;
    // +30 next Battle is a real future liability, so demand a meaningful current swing.
    const flips=(us>=them&&after<them), savesCritical=critical&&flips;
    if(!flips&&!savesCritical&&lead>0)return -999;
    return 42+now*1.6+(flips?45:0)+(critical?15:0)-cost*8;
  }
  if(k==='2for20')return 48+Math.min(20,us)*1.4+(us-20<them?22:0)-cost*6;
  if(k==='1for10')return 38+Math.min(10,us)*1.3+(us-10<them?18:0);
  if(k==='itsgonnacostya')return 48+Math.min(15,us)*1.3+aiRecoverable(1,2)*5;
  if(k==='greedtax'){
    const drop=p.hotDogs>=6?Math.min(20,us):0, rec=aiRecoverable(1,2);
    return 25+drop*1.5+rec*5;
  }
  if(k==='riskydraw')return 28+(us-10<them?10:0)+(state.deepPlaybook?8:0)-cost*4;
  if(k==='worththerisk'){
    // 1/3 chance to hit 0 is powerful when losing; +25 is dangerous when already ahead.
    if(lead>=15&&!critical)return -999;
    return lead<0?48:24;
  }
  if(k==='highstakespumpup'){
    // +10 now is bad in Lowball. Only gamble when this Battle is effectively lost and
    // banking -20 for the next Hero has enough future value.
    if(lead>=0)return -999;
    if(Math.abs(lead)<25&&!critical)return -999;
    return state.battle<7?24: -999;
  }
  if(k==='nastyornada'||k==='lucky7'){
    // These primarily increase our Power, which is bad in Lowball. Dice/Deep draw alone
    // is not enough unless the game is critical and there is no safer value line.
    return -999;
  }
  if(k==='diceduel'){
    // Winning the roll adds +25 (bad); a tie gives -10 (good). Avoid voluntarily using it.
    return -999;
  }
  if(k==='pickonsomeoneyourownsize'){
    // Equalizing cannot create a Lowball lead; use only if other persistent interactions matter.
    return -999;
  }
  if(k==='deadlinedeal'){
    // Swap is excellent only when Alpha currently has the higher (losing) Power.
    return us>them ? 80+(us-them)*2-cost*6 : -999;
  }
  if(k==='forcedretreat'){
    // Hidden replacement is uncertain. Only attack a currently very low opposing Hero.
    return them<=120&&lead<=0 ? 34-cost*5 : -999;
  }
  if(k==='steeldefense'){
    if(p.arena[state.battle-1]?.weapon!=='STEEL'||!aiCpuHasHonors()||lead<=0)return -999;
    return 60+(critical?15:0);
  }
  if(k==='restrictedlist')return state.battle<7 ? 34+(critical?8:0)-cost*4 : -999;
  if(k==='quickdraw'||k==='cheapaddition'||k==='sacrificeandscheme'||k==='refillandreload'||k==='reload'||k==='deepintheplaybook'||k==='grilledbandit'||k==='backfromthedumps'||k==='updog'||k==='doggoneflip'||k==='byanymeansnecessary'||k==='polishedcomeback'||k==='luckofthedraw'||k==='hagotcha')return null;
  return null;
}
const aiCardUtilityV347Base=aiCardUtility;
aiCardUtility=function(card){
  let u=aiCardUtilityV347Base(card);
  if(!alphaLowball())return u;
  const lu=alphaLowballUtility(card);
  if(lu!==null)return lu;
  const k=norm(card.name),lead=alphaLowballLead(),cost=effectiveCost(card);
  // Generic guard: in Lowball, never spend resources on a mostly-Power-increasing Play.
  if(alphaIsMostlyPowerPlay(card))return -999;
  // If already comfortably lower, preserve paid cards unless they create future/resource value.
  if(lead>=20&&cost>0){
    const t=String(card.ability||card.text||'').toLowerCase();
    const future=/draw|recover|rest of the game|next battle|playbook|can.?t run|maximum of 1 play|search/.test(t);
    if(!future)u-=35;
  }
  return u;
};

const alphaPreCommitReasonV347Base=alphaPreCommitReason;
alphaPreCommitReason=function(card){
  const base=alphaPreCommitReasonV347Base(card);
  if(!alphaLowball())return base;
  const k=norm(card.name),lu=alphaLowballUtility(card),lead=alphaLowballLead();
  if(lu!==null&&lu<20)return `Lowball: ${card.name} does not improve Alpha's lowest-Power position`;
  if(alphaIsMostlyPowerPlay(card)&&!['noblesacrifice','transferportal','2for20','1for10','itsgonnacostya','greedtax'].includes(k))return `Lowball: raising Alpha's own Power is counterproductive`;
  if(lead>=25&&effectiveCost(card)>0&&lu===null){
    const t=String(card.ability||card.text||'').toLowerCase();
    if(!/draw|recover|rest of the game|next battle|playbook|maximum of 1 play|search/.test(t))return `Lowball: already leads by ${lead}; preserving the Play and Hot Dogs`;
  }
  return base;
};

// Lowball substitution: replace with a lower-Power Bench Hero when the improvement is worth 2 HD.
const aiChooseSubstitutionV347Base=aiChooseSubstitution;
aiChooseSubstitution=function(){
  if(!alphaLowball())return aiChooseSubstitutionV347Base();
  if(!isCPU(state.subActive)||state.aiBusy)return;
  state.aiBusy=true;
  const p=state.players[1],current=p.arena[state.battle-1];
  const best=p.bench.reduce((a,h,i)=>!a||Number(h.power)<Number(a.h.power)?{h,i}:a,null);
  let doSub=false;
  if(best&&p.hotDogs>=2){
    const improvement=Number(current.power)-Number(best.h.power), critical=alphaBattleImportance()>=3;
    const opp=Number(state.players[0]?.arena?.[state.battle-1]?.power??state.players[0]?.battlePower??999);
    const wouldFlip=Number(current.power)>=opp&&Number(best.h.power)<opp;
    doSub=improvement>0&&(wouldFlip||improvement>=(critical?5:15));
  }
  $('#battleMessage').innerHTML='<span class="ai-thinking">Alpha AI is evaluating its Lowball substitution</span>';
  setTimeout(()=>{if(doSub)state.selectedSub=best.i;alphaDecisionLog(doSub?`Lowball substitution: ${current.power} → ${best.h.power}.`:`Lowball: kept ${current.power}; substitution was not worth 2 HD.`);state.aiBusy=false;finishSubDecision(doSub)},500);
};

// V3.50 — Alpha AI pass discipline + Grilled Bandit hard guardrails.
// Passing is a real option. When Alpha is behind it only spends a Play if the action can
// materially improve the Battle or creates strong future value without feeding the opponent.
function alphaRecoveryProfile(card){
  const k=norm(card.name),t=String(card.ability||card.text||'').toLowerCase();
  const knownRecovery=['backfromthedumps','doggoneflip','updog','overflowtax','trashbandit','synergysnacks','delayedrecovery'];
  const mixedRecovery=['greedtax','itsgonnacostya','thechampionslasso'];
  return {has:knownRecovery.includes(k)||mixedRecovery.includes(k)||/recover\s+\d+|recovers?\s+\d+|hot dogs? back/.test(t),pure:knownRecovery.includes(k)||aiRecoveryOnlyKey(k),mixed:mixedRecovery.includes(k)};
}
function alphaFutureValue(card){
  const k=norm(card.name),t=String(card.ability||card.text||'').toLowerCase();
  if(['deepintheplaybook','grilledbandit','restrictedlist','doggoneinflation','burnthetimeline','emergencyshutdown','easychoice','rollingreset'].includes(k))return true;
  return /rest of the game|next battle|future|maximum of 1 play|can.?t run|cost.*next|honors next/.test(t);
}
function alphaCanImproveCurrentBattle(card){
  const p=state.players[1],opp=state.players[0],k=norm(card.name),us=Number(p.battlePower??0),them=Number(opp.battlePower??0),low=currentGameMode().lowWins;
  const losing=low?us>=them:us<=them;
  if(!losing)return true;
  if(low){
    if(k==='noblesacrifice'||k==='sacrificeitalltowin')return us>0&&0<them;
    if(k==='deadlinedeal')return us>them;
    if(k==='transferportal')return Math.max(0,us-30)<them;
    if(k==='2for20')return Math.max(0,us-20)<them;
    if(k==='1for10')return Math.max(0,us-10)<them;
    if(k==='itsgonnacostya')return Math.max(0,us-15)<them;
    if(k==='greedtax'&&p.hotDogs>=6)return Math.max(0,us-20)<them;
    if(k==='riskydraw'||k==='worththerisk')return true; // probabilistic route to lower Power
    if(k==='forcedretreat'||k==='hagotcha'||k==='polishedcomeback')return true; // board-changing effects
    if(k==='steeldefense'||k==='restrictedlist')return false; // protection/control, not a current comeback
    if(alphaIsMostlyPowerPlay(card))return false;
    return false;
  }
  // Standard high-Power modes: only count a direct printed boost if it can plausibly close the gap.
  const deficit=them-us,impact=alphaPrintedPowerImpact(card);
  if(k==='deadlinedeal'||k==='pickonsomeoneyourownsize'||k==='forcedretreat'||k==='hagotcha')return true;
  return impact!==null&&impact>0&&impact>=Math.max(5,deficit-5);
}
function alphaBanditBlocksCard(card){
  if(!aiOpponentBandit()&&!aiBothBandits())return '';
  const r=alphaRecoveryProfile(card),k=norm(card.name);
  if(!r.has)return '';
  if(aiBothBandits()&&r.pure)return 'Hot Dog recovery is locked because both Grilled Bandits are active';
  if(aiOpponentBandit()&&r.pure)return `opponent's Grilled Bandit would steal this recovery`;
  // Mixed recovery Plays may still be useful for a separate, battle-changing effect. Otherwise hold them.
  if(aiOpponentBandit()&&r.mixed&&!alphaCanImproveCurrentBattle(card))return `opponent's Grilled Bandit would steal the recovery and the other effect does not improve this Battle`;
  return '';
}
const alphaPreCommitReasonV350Base=alphaPreCommitReason;
alphaPreCommitReason=function(card){
  if(aiIsAlpha()){
    const bandit=alphaBanditBlocksCard(card);if(bandit)return bandit;
    const lead=aiPowerLead(),cost=effectiveCost(card),critical=alphaBattleImportance()>=3;
    if(lead<0&&!alphaCanImproveCurrentBattle(card)){
      // A future engine/control card can be justified while behind only when cheap and strategically meaningful.
      if(!(alphaFutureValue(card)&&cost===0&&critical))return `currently losing by ${Math.abs(lead)}; this Play does not materially improve the Battle`;
    }
  }
  return alphaPreCommitReasonV350Base(card);
};

// Final Alpha turn driver: re-evaluate after every Play and stop as soon as the remaining
// options are worse than passing. This prevents resource dumping after the human passes.
aiPlayTurn=async function(){
  if(!aiIsAlpha())return aiPlayTurnV342Base();
  if(!state.computerMode||state.active!==1||state.aiBusy)return;
  state.aiBusy=true;$('#playPhaseHelp').textContent='Alpha AI is evaluating whether playing or passing is stronger.';let plays=0;
  while(plays<10){
    if(state.pendingEffect){await aiResolvePendingDiscards();await new Promise(r=>setTimeout(r,180));continue}
    const p=state.players[1],lead=aiPowerLead();
    const evaluated=p.playHand.map(c=>({c,u:aiCardUtility(c),seq:aiSequencePriority(c),reason:alphaPreCommitReason(c),cost:effectiveCost(c)}));
    if(alphaLogEnabled())evaluated.filter(x=>x.reason).slice(0,6).forEach(x=>alphaDecisionLog(`Held ${x.c.name}: ${x.reason}.`));
    // Passing gets a higher threshold while already ahead, and a rescue threshold while behind.
    const threshold=lead<0?28:(lead>=25?30:22);
    let choices=evaluated.filter(x=>!x.reason&&x.u>=threshold&&x.cost<=p.hotDogs);
    if(!choices.length){alphaDecisionLog(`Passed with ${p.hotDogs} HD; passing was stronger than spending another Play.`);break}
    const setup=choices.filter(x=>!['playbooster','10perplay'].includes(norm(x.c.name)));
    if(setup.length)choices=setup;
    choices.sort((a,b)=>(b.seq-a.seq)||(b.u-a.u));
    const chosen=choices[0];
    alphaDecisionLog(`Ran ${chosen.c.name} (score ${Math.round(chosen.u)}, cost ${chosen.cost} HD, position ${aiPowerLead()>=0?'ahead':'behind'} by ${Math.abs(aiPowerLead())}).`);
    $('#battleMessage').innerHTML='<span class="ai-thinking">Alpha AI is considering whether to play or pass</span>';
    await new Promise(r=>setTimeout(r,380));await runPlayCardV34(chosen.c.id);plays++;
    await new Promise(r=>setTimeout(r,220));
    if(state.pendingEffect)await aiResolvePendingDiscards();
  }
  state.aiBusy=false;
  if(state.turnOrder[0]===1){$('#battleMessage').innerHTML+=`<br><strong>Alpha AI ${plays?'finished':'passed'}.</strong> Your Play opportunity begins.`;startPlayPhaseV34(0)}else finishPlayPhaseForBattle();
};

// V3.51 — Alpha match-point survival + one-time Deep In The Playbook discipline.
// If the opponent already has 3 Battle wins, Alpha treats the current Battle as elimination:
// it will chain any action that moves the current Battle toward survival, even when one card
// alone cannot erase the whole deficit. Future-only value never justifies ignoring elimination.
function alphaOpponentAtMatchPoint(){return (state.scores?.[0]||0)>=3}
function alphaCurrentBattleLosing(){return aiPowerLead()<0}
function alphaDeepAlreadyActive(){return !!state.deepPlaybook}
function alphaMovesTowardCurrentWin(card){
  const p=state.players[1],opp=state.players[0],k=norm(card.name),us=Number(p.battlePower??0),them=Number(opp.battlePower??0),low=currentGameMode().lowWins;
  if(!alphaCurrentBattleLosing())return true;
  if(low){
    if(['noblesacrifice','sacrificeitalltowin'].includes(k))return us>0;
    if(k==='transferportal')return us>0;
    if(k==='2for20')return us>0;
    if(k==='1for10')return us>0;
    if(k==='itsgonnacostya')return us>0;
    if(k==='greedtax'&&p.hotDogs>=6)return us>0;
    if(['riskydraw','worththerisk','deadlinedeal','forcedretreat','hagotcha','polishedcomeback','pickonsomeoneyourownsize'].includes(k))return true;
    // In Lowball, printed +Power to Alpha is not a rescue action.
    return false;
  }
  if(['deadlinedeal','pickonsomeoneyourownsize','forcedretreat','hagotcha','polishedcomeback'].includes(k))return true;
  const impact=alphaPrintedPowerImpact(card);
  return impact!==null&&impact>0;
}
const alphaPreCommitReasonV351Base=alphaPreCommitReason;
alphaPreCommitReason=function(card){
  if(aiIsAlpha()){
    const k=norm(card.name);
    if(k==='deepintheplaybook'&&alphaDeepAlreadyActive())return 'Deep In The Playbook is already active for the rest of the Game';
    if(alphaOpponentAtMatchPoint()&&alphaCurrentBattleLosing()&&!alphaMovesTowardCurrentWin(card)){
      return 'opponent has 3 Battle wins; this Play does not help Alpha survive the current Battle';
    }
  }
  return alphaPreCommitReasonV351Base(card);
};

// Final V3.51 Alpha turn driver. At opponent match point, survival outranks conservation:
// Alpha keeps chaining current-Battle improvement cards until it gets ahead/tied or exhausts
// every legal rescue line. Outside elimination Battles, normal V3.50 pass discipline remains.
aiPlayTurn=async function(){
  if(!aiIsAlpha())return aiPlayTurnV342Base();
  if(!state.computerMode||state.active!==1||state.aiBusy)return;
  state.aiBusy=true;$('#playPhaseHelp').textContent=alphaOpponentAtMatchPoint()?'Alpha AI is fighting to stay alive in the match.':'Alpha AI is evaluating whether playing or passing is stronger.';let plays=0;
  while(plays<12){
    if(state.pendingEffect){await aiResolvePendingDiscards();await new Promise(r=>setTimeout(r,180));continue}
    const p=state.players[1],lead=aiPowerLead(),mustSurvive=alphaOpponentAtMatchPoint()&&lead<0;
    const evaluated=p.playHand.map(c=>({c,u:aiCardUtility(c),seq:aiSequencePriority(c),reason:alphaPreCommitReason(c),cost:effectiveCost(c),rescue:alphaMovesTowardCurrentWin(c)}));
    if(alphaLogEnabled())evaluated.filter(x=>x.reason).slice(0,6).forEach(x=>alphaDecisionLog(`Held ${x.c.name}: ${x.reason}.`));
    let choices;
    if(mustSurvive){
      // Do not require one card to flip the entire deficit. A -10/-20/-30 Lowball card (or
      // +Power card in normal formats) may be one step in a multi-card comeback sequence.
      choices=evaluated.filter(x=>!x.reason&&x.rescue&&x.cost<=p.hotDogs&&x.u>-999);
    }else{
      const threshold=lead<0?28:(lead>=25?30:22);
      choices=evaluated.filter(x=>!x.reason&&x.u>=threshold&&x.cost<=p.hotDogs);
    }
    if(!choices.length){
      alphaDecisionLog(mustSurvive?`Passed with ${p.hotDogs} HD; no legal Play remaining could move the Battle toward survival.`:`Passed with ${p.hotDogs} HD; passing was stronger than spending another Play.`);break
    }
    const setup=choices.filter(x=>!['playbooster','10perplay'].includes(norm(x.c.name)));
    if(setup.length)choices=setup;
    choices.sort((a,b)=>(b.seq-a.seq)||(b.u-a.u));
    const chosen=choices[0];
    alphaDecisionLog(`Ran ${chosen.c.name} (score ${Math.round(chosen.u)}, cost ${chosen.cost} HD, position ${aiPowerLead()>=0?'ahead':'behind'} by ${Math.abs(aiPowerLead())}${mustSurvive?', elimination Battle':''}).`);
    $('#battleMessage').innerHTML='<span class="ai-thinking">Alpha AI is considering whether to play or pass</span>';
    await new Promise(r=>setTimeout(r,380));await runPlayCardV34(chosen.c.id);plays++;
    await new Promise(r=>setTimeout(r,220));
    if(state.pendingEffect)await aiResolvePendingDiscards();
  }
  state.aiBusy=false;
  if(state.turnOrder[0]===1){$('#battleMessage').innerHTML+=`<br><strong>Alpha AI ${plays?'finished':'passed'}.</strong> Your Play opportunity begins.`;startPlayPhaseV34(0)}else finishPlayPhaseForBattle();
};

// V3.52 — global Deep awareness, Grilled Bandit anti-mirror discipline, and Meta Deck 2 game plan.
// Deep In The Playbook is a GLOBAL rest-of-game effect: once either player runs it, nobody
// needs to run another copy. Alpha also refuses to play Grilled Bandit into an opposing Bandit;
// doing so spends 5 HD and destroys the recovery advantage Alpha is trying to create.
const startSimpleMatchV352Base=startSimpleMatch;
startSimpleMatch=function(computer,difficulty='normal'){
  state.aiPlayDeckName=computer?($('#simpleP2Play')?.value||''):'';
  return startSimpleMatchV352Base(computer,difficulty);
};
function alphaUsingMetaDeck2(){return state.aiPlayDeckName==='Meta Deck 2'}
function alphaGlobalDeepActive(){return !!state.deepPlaybook}
function alphaOpponentHasBandit(){return !!state.players[0]?.effects?.grilledBandit}
function alphaOwnBanditActive(){return !!state.players[1]?.effects?.grilledBandit}

const alphaPreCommitReasonV352Base=alphaPreCommitReason;
alphaPreCommitReason=function(card){
  if(aiIsAlpha()){
    const k=norm(card.name);
    if(k==='deepintheplaybook'&&alphaGlobalDeepActive())return 'Deep In The Playbook is already active globally; both players already get its dice-draw effect';
    if(k==='grilledbandit'&&alphaOpponentHasBandit())return `opponent already has Grilled Bandit; a second Bandit would cost 5 HD and eliminate Alpha's recovery advantage`;
  }
  return alphaPreCommitReasonV352Base(card);
};

// Meta Deck 2 is an engine/control deck: draw Plays, deliberately stock the Hero discard pile,
// turn that discard pile into Power, pressure the opponent's HD economy, then Reload the piece
// that best supports the current plan. These values are strategic, not an instruction to dump cards.
const aiCardUtilityV352Base=aiCardUtility;
aiCardUtility=function(card){
  let u=aiCardUtilityV352Base(card);
  if(!aiIsAlpha()||!alphaUsingMetaDeck2())return u;
  const p=state.players[1],opp=state.players[0],k=norm(card.name),run=p.playsRunThisBattle||0;
  const discardCount=p.heroDiscard?.length||0, early=state.battle<=3, late=state.battle>=5;
  const opponentBandit=alphaOpponentHasBandit(), ownBandit=alphaOwnBanditActive();

  // Card-flow engine. Drawing is valuable because it finds both discard enablers and payoffs.
  if(k==='quickdraw')u+=early?34:16;
  if(k==='cheapaddition')u+=28;
  if(k==='onlyupside')u+=26+(state.deepPlaybook?8:0);
  if(k==='playbooster')u+=Math.max(0,run-1)*12;
  if(k==='2for20')u+=22; // two new Plays; power loss is the real cost in normal formats.
  if(k==='deepintheplaybook')u+=state.deepPlaybook?-999:30;

  // Hero-discard engine. Sacrifice / Locker Room create fuel for Fallen Fighters & Weapon Lineage.
  if(k==='sacrificeandscheme')u+=32+(p.bench?.length>=2?10:-20);
  if(k==='lockerroomevacuation')u+=30;
  if(k==='fallenfighters')u+=discardCount*6+(p.bench?.length?10:-30);
  if(k==='weaponlineage')u+=discardCount*7;

  // Hot Dog control. Inflation is cheap disruption; Bandit is an investment only when Alpha can
  // own the recovery asymmetry. Never mirror an opponent Bandit.
  if(k==='doggoneinflation')u+=state.battle<7?32:8;
  if(k==='grilledbandit'){
    if(opponentBandit)return -999;
    u+=state.battle<=4?38:10;
    u+=aiRecoverySupportScore();
    if(p.hotDogs<5)return -999;
  }
  if(ownBandit&&!opponentBandit&&['backfromthedumps','doggoneflip','updog','overflowtax'].includes(k))u+=20;

  // Reload is the deck's recursion glue. Its value comes from the best USED card, not from Reload itself.
  if(k==='reload'){
    const eligible=(p.playedStacks||[]).slice(0,state.battle-1).flat();
    if(!eligible.length)return -999;
    const best=Math.max(...eligible.map(aiReloadTargetScore));
    u+=Math.max(0,best-20);
  }
  // Don't turn engine-building into pointless resource dumping while already secure.
  if(aiPowerLead()>=30&&!late&&effectiveCost(card)>0&&!['doggoneinflation'].includes(k))u-=18;
  return u;
};

const aiSequencePriorityV352Base=aiSequencePriority;
aiSequencePriority=function(card){
  let s=aiSequencePriorityV352Base(card);
  if(!aiIsAlpha()||!alphaUsingMetaDeck2())return s;
  const k=norm(card.name),p=state.players[1];
  if(k==='deepintheplaybook')return state.deepPlaybook?-999:210;
  if(k==='doggoneinflation')return state.turnOrder?.[0]===1?195:120;
  if(k==='grilledbandit')return alphaOpponentHasBandit()?-999:185;
  if(['quickdraw','sacrificeandscheme','lockerroomevacuation','cheapaddition','onlyupside','2for20'].includes(k))return 125;
  if(k==='reload')return 105;
  if(['fallenfighters','weaponlineage','heavyhanded','unifiedfront','bankedpower'].includes(k))return 65;
  if(k==='playbooster')return -70; // payoff after setup/draw actions.
  return s;
};

const aiReloadTargetScoreV352Base=aiReloadTargetScore;
aiReloadTargetScore=function(card){
  let v=aiReloadTargetScoreV352Base(card);
  if(!aiIsAlpha()||!alphaUsingMetaDeck2())return v;
  const k=norm(card.name),p=state.players[1];
  if(k==='deepintheplaybook'&&state.deepPlaybook)return -999;
  if(k==='grilledbandit'){
    if(alphaOpponentHasBandit()||alphaOwnBanditActive())return -999;
    v+=45;
  }
  if(k==='doggoneinflation')v+=state.battle<7?65:10;
  if(k==='quickdraw')v+=state.battle<=2?45:18;
  if(k==='sacrificeandscheme')v+=p.bench?.length>=2?38:0;
  if(k==='lockerroomevacuation')v+=32;
  if(k==='cheapaddition'||k==='onlyupside')v+=28;
  if(k==='playbooster')v+=(p.playsRunThisBattle||0)>=2?42:8;
  if(k==='weaponlineage'||k==='fallenfighters')v+=(p.heroDiscard?.length||0)*7;
  return v;
};

// V3.54 — Grilled Bandit recovery sequencing.
// Back From The Dumps is a payoff, not an automatic follow-up to Bandit. Alpha waits until the
// opponent has at least 3 recoverable HD so the redirect is fully loaded, unless Alpha urgently
// needs its own recovery to unlock a paid Battle-changing Play. Pressure/recovery setup such as
// Overflow Tax should happen before cashing in Back From The Dumps when possible.
function alphaNeedsImmediateDogsForRescue(){
  const p=state.players[1];
  if(!p||p.hotDogs>=3)return false;
  return (p.playHand||[]).some(c=>{
    const k=norm(c.name);if(k==='backfromthedumps')return false;
    const cost=effectiveCost(c);
    return cost>p.hotDogs&&cost<=Math.min(10,p.hotDogs+3)&&alphaCanImproveCurrentBattle(c);
  });
}
function alphaBanditDumpsReady(){
  if(!alphaOwnBanditActive()||alphaOpponentHasBandit())return true;
  return aiRecoverable(0,3)>=3;
}
const alphaPreCommitReasonV353Base=alphaPreCommitReason;
alphaPreCommitReason=function(card){
  if(aiIsAlpha()&&norm(card.name)==='backfromthedumps'&&alphaOwnBanditActive()&&!alphaOpponentHasBandit()){
    const oppRecoverable=aiRecoverable(0,3);
    if(oppRecoverable<3&&!alphaNeedsImmediateDogsForRescue()){
      return `holding Back From The Dumps for Grilled Bandit value; opponent currently has only ${oppRecoverable} recoverable HD (target is 3)`;
    }
  }
  return alphaPreCommitReasonV353Base(card);
};
const aiCardUtilityV353Base=aiCardUtility;
aiCardUtility=function(card){
  let u=aiCardUtilityV353Base(card);
  if(!aiIsAlpha())return u;
  const k=norm(card.name),p=state.players[1];
  if(alphaOwnBanditActive()&&!alphaOpponentHasBandit()){
    const oppRecoverable=aiRecoverable(0,3),ownRecoverable=aiRecoverable(1,3);
    if(k==='backfromthedumps'){
      // Reward actual available recovery, with a large premium for a fully loaded opponent redirect.
      u+=ownRecoverable*5+oppRecoverable*14;
      if(oppRecoverable>=3)u+=55;
      else u-=45;
    }
    if(k==='overflowtax'&&oppRecoverable<3)u+=30; // take/setup value before cashing the Bandit payoff.
    if(k==='doggoneinflation'&&oppRecoverable<3)u+=22; // pressure opponent into spending HD first.
  }
  return u;
};
const aiSequencePriorityV353Base=aiSequencePriority;
aiSequencePriority=function(card){
  let s=aiSequencePriorityV353Base(card);
  if(!aiIsAlpha()||!alphaOwnBanditActive()||alphaOpponentHasBandit())return s;
  const k=norm(card.name),oppRecoverable=aiRecoverable(0,3);
  if(k==='backfromthedumps')return oppRecoverable>=3?235:-180;
  if(k==='overflowtax'&&oppRecoverable<3)return 205;
  if(k==='doggoneinflation'&&oppRecoverable<3)return 215;
  return s;
};

// V3.59 — Alpha AI contextual Playbook-search decisions.
// Search effects such as Free Play and By Any Means Necessary must evaluate the actual
// current board, format, persistent effects, sequence value, and pass/hold guardrails.
// Alpha no longer selects a searched Play from a generic static utility ranking alone.
function alphaSearchTargetScore(card,{free=true,maxCost=null}={}){
  if(!aiIsAlpha())return -9999;
  if(maxCost!==null&&(Number(card.cost)||0)>maxCost)return -9999;
  const probe={...card};
  if(free)probe.freeOnce=true;
  const reason=alphaPreCommitReason(probe);
  if(reason)return -9999;
  let utility=aiCardUtility(probe);
  if(!Number.isFinite(utility)||utility<=-999)return -9999;
  let sequence=aiSequencePriority(probe);
  if(!Number.isFinite(sequence))sequence=0;
  const k=norm(probe.name);
  // Search effects should favor cards that can be used now, while still respecting
  // high-value engine/control pieces identified by the existing Alpha strategy layers.
  let score=utility+(sequence>0?Math.min(sequence,240)*0.35:sequence*0.15);
  if(alphaOpponentAtMatchPoint()&&alphaCurrentBattleLosing()){
    if(alphaMovesTowardCurrentWin(probe))score+=90;
    else score-=120;
  }
  if(k==='deepintheplaybook'&&alphaGlobalDeepActive())return -9999;
  if(k==='grilledbandit'&&alphaOpponentHasBandit())return -9999;
  if(alphaLowball()){
    const lu=alphaLowballUtility(probe);
    if(lu!==null)score+=lu*0.45;
  }
  return score;
}

freePlaySearch=function(p,card,idx,cost,maxCost=3){
  const eligible=p.plays.filter(x=>(Number(x.cost)||0)<=maxCost);
  if(!eligible.length)return false;
  const resolve=chosen=>{
    spendDogsForPlay(p,cost);
    commitPlay(p,card,idx);
    p.plays=p.plays.filter(x=>x.id!==chosen.id);p.plays=shuffle(p.plays);
    chosen.freeOnce=true;p.playHand.push(chosen);closeChoice();
    refreshAfterPlay(`${card.name}: running ${chosen.name} for free.`);
    setTimeout(()=>runPlayCardV34(chosen.id),80);
  };
  if(aiIsAlpha()&&state.active===1){
    const ranked=eligible.map(c=>({c,score:alphaSearchTargetScore(c,{free:true,maxCost})})).sort((a,b)=>b.score-a.score);
    const chosen=(ranked.find(x=>x.score>-9999)||ranked[0])?.c;
    if(!chosen)return false;
    alphaDecisionLog(`Free Play searched the Playbook and selected ${chosen.name} as the best contextual free target.`);
    resolve(chosen);
  }else if(state.computerMode&&state.active===1){
    resolve(eligible.slice().sort((a,b)=>aiCardUtility(b)-aiCardUtility(a))[0]);
  }else chooseCards(card.name,`Choose a Play costing ${maxCost} HD or less to run for free.`,eligible,'play',resolve);
  return true;
};

byAnyMeans=function(p,card,idx,cost){
  if(!p.plays.length)return;
  const resolve=chosen=>{
    spendDogsForPlay(p,cost);
    commitPlay(p,card,idx);
    p.plays=p.plays.filter(x=>x.id!==chosen.id);p.plays=shuffle(p.plays);
    chosen.freeOnce=true;p.playHand.push(chosen);closeChoice();
    refreshAfterPlay(`${card.name}: running ${chosen.name} for free.`);
    setTimeout(()=>runPlayCardV34(chosen.id),80);
  };
  if(aiIsAlpha()&&state.active===1){
    const ranked=p.plays.map(c=>({c,score:alphaSearchTargetScore(c,{free:true})})).sort((a,b)=>b.score-a.score);
    const chosen=(ranked.find(x=>x.score>-9999)||ranked[0])?.c;
    if(!chosen)return;
    alphaDecisionLog(`By Any Means Necessary searched the full Playbook and selected ${chosen.name} for the current position.`);
    resolve(chosen);
  }else chooseCards('Search your Playbook','Choose any Play. It will run immediately for free.',p.plays,'play',resolve);
};
