(() => {
  const $ = id => document.getElementById(id);
  const model = { hundreds: 0, tens: 3, ones: 2 };
  const answer = { hundreds: 0, tens: 0, ones: 0 };
  let mode = 'build';
  let problem = null;
  let pending = null;
  let drag = null;

  const clamp = (value, max = 999) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
  const valueOf = units => units.hundreds * 100 + units.tens * 10 + units.ones;
  const answerValue = () => valueOf(answer) + (pending === 'ten' ? 10 : pending === 'hundred' ? 100 : 0);
  const dots = (cx, cy, r, count = 10, radius = 2.25) => Array.from({length: count}, (_,i) => {
    const angle = -Math.PI/2 + i * Math.PI*2/count;
    return `<circle class="ten-dot" cx="${(cx+Math.cos(angle)*r).toFixed(2)}" cy="${(cy+Math.sin(angle)*r).toFixed(2)}" r="${radius}"/>`;
  }).join('');
  const tenSvg = (size=54, interactive=false, index=0, count=index+1) => `<svg class="unit-svg" ${interactive ? `role="button" tabindex="0" aria-label="Open ten group ${count}" data-open-ten="${index}"` : 'aria-hidden="true"'} width="${size}" height="${size}" viewBox="0 0 54 54"><circle class="ten-circle" cx="27" cy="27" r="24"/>${dots(27,27,14)}<text class="unit-value" x="27" y="30.5">${count}</text></svg>`;
  const hundredSvg = (size=90, interactive=false, index=0) => {
    const positions = Array.from({length:10},(_,i)=>[27+Math.cos(-Math.PI/2+i*Math.PI*2/10)*16,27+Math.sin(-Math.PI/2+i*Math.PI*2/10)*16]);
    const groups = positions.map(([x,y])=>`<g><circle class="nested-ten" cx="${x}" cy="${y}" r="5.6"/>${dots(x,y,3.1,10,.75)}</g>`).join('');
    return `<svg class="unit-svg" ${interactive ? `role="button" tabindex="0" aria-label="Open hundred ${index+1} into ten groups" data-open-hundred="${index}"` : 'aria-hidden="true"'} width="${size}" height="${size}" viewBox="0 0 54 54"><circle class="hundred-circle" cx="27" cy="27" r="26"/>${groups}<text class="hundred-value" x="27" y="29">${index+1}</text></svg>`;
  };
  const dotSvg = (size=24,label=1) => `<svg class="unit-svg" aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24"><circle class="one-dot" cx="12" cy="12" r="10"/><text class="one-value" x="12" y="15">${label}</text></svg>`;
  const dotsHTML = n => {
    const rows=[];
    for(let offset=0;offset<n;offset+=10){
      const items=Array.from({length:Math.min(10,n-offset)},(_,i)=>`<span class="dot-small">${i+1}</span>`).join('');
      rows.push(`<div class="count-row ones-row">${items}</div>`);
    }
    return rows.join('');
  };
  const oneRowsHTML = n => {
    const rows=[];
    for(let offset=0;offset<n;offset+=10)rows.push(`<div class="count-row ones-row">${Array.from({length:Math.min(10,n-offset)},(_,i)=>dotSvg(24,i+1)).join('')}</div>`);
    return rows.join('');
  };
  const tensHTML = (n,size=42) => {
    const rows=[];
    for(let offset=0;offset<n;offset+=5)rows.push(`<div class="count-row tens-row">${Array.from({length:Math.min(5,n-offset)},(_,i)=>tenSvg(size,false,i,i+1)).join('')}</div>`);
    return rows.join('');
  };
  const hundredsHTML = (n,size=76) => Array.from({length:n},(_,i)=>hundredSvg(size,false,i)).join('');

  function renderBuilder() {
    $('hundreds-units').innerHTML = model.hundreds ? hundredsHTML(model.hundreds,91).replaceAll('aria-hidden="true"','role="img" aria-label="one hundred"') : '<span class="empty-note">No hundreds</span>';
    $('tens-units').innerHTML = model.tens ? Array.from({length:model.tens},(_,i)=>tenSvg(50,true,i)).join('') : '<span class="empty-note">No tens</span>';
    $('ones-units').innerHTML = model.ones ? oneRowsHTML(model.ones) : '<span class="empty-note">No loose ones</span>';
    $('hundreds-count').textContent=model.hundreds;$('tens-count').textContent=model.tens;$('ones-count').textContent=model.ones;
    $('make-ten').hidden=model.ones<10;$('make-hundred').hidden=model.tens<10;
    const parts=[];if(model.hundreds)parts.push(`${model.hundreds} ${model.hundreds===1?'hundred':'hundreds'}`);if(model.tens)parts.push(`${model.tens} ${model.tens===1?'ten':'tens'}`);if(model.ones||!parts.length)parts.push(`${model.ones} ${model.ones===1?'one':'ones'}`);
    $('live-equation').innerHTML=`${parts.join(' + ')} <span>=</span> ${valueOf(model)}`;
    const expanded=[];if(model.hundreds)expanded.push(model.hundreds*100);if(model.tens)expanded.push(model.tens*10);if(model.ones||!expanded.length)expanded.push(model.ones);
    $('expanded-equation').textContent=`${valueOf(model)} = ${expanded.join(' + ')}`;
    $('reflection-text').textContent=valueOf(model)===32?'Can you show 32 another way and keep the total?':'What could we change without changing the total?';
  }

  function setModelNumber(number) { model.hundreds=Math.floor(number/100);model.tens=Math.floor(number%100/10);model.ones=number%10;renderBuilder(); }
  function renderAll() { if(mode==='build')renderBuilder(); else renderOperation(); }

  $('show-number').addEventListener('click',()=>setModelNumber(clamp($('number-input').value)));
  $('number-input').addEventListener('keydown',e=>{if(e.key==='Enter')$('show-number').click();});
  $('reset-build').addEventListener('click',()=>{$('number-input').value=32;setModelNumber(32);});
  $('add-one').addEventListener('click',()=>{if(valueOf(model)<999){model.ones++;renderBuilder();}});
  $('make-ten').addEventListener('click',()=>{if(model.ones>=10){model.ones-=10;model.tens++;renderBuilder();}});
  $('make-hundred').addEventListener('click',()=>{if(model.tens>=10){model.tens-=10;model.hundreds++;renderBuilder();}});
  document.addEventListener('click',e=>{const ten=e.target.closest('[data-open-ten]'),hundred=e.target.closest('[data-open-hundred]');if(ten&&mode==='build'){model.tens--;model.ones+=10;renderBuilder();}if(hundred&&mode==='build'){model.hundreds--;model.tens+=10;renderBuilder();}});
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-open-ten],[data-open-hundred]')){e.preventDefault();e.target.click();}});

  document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{
    mode=tab.dataset.mode;document.querySelectorAll('.tab').forEach(item=>item.classList.toggle('active',item===tab));
    $('build-view').hidden=mode!=='build';$('take-view').hidden=mode==='build';
    if(mode!=='build')startProblem(mode);else renderBuilder();
  }));

  function startProblem(operation=mode) {
    const a=clamp($('minuend-input').value),maxB=operation==='take'?a:999-a,b=clamp($('subtrahend-input').value,maxB);
    $('minuend-input').value=a;$('subtrahend-input').value=b;answer.hundreds=answer.tens=answer.ones=0;pending=null;
    problem={operation,a,b,target:operation==='take'?a-b:a+b,regrouped:false,writtenUnlocked:false,starting:{hundreds:Math.floor(a/100),tens:Math.floor(a%100/10),ones:a%10}};
    $('operation-title').textContent=operation==='take'?'Take away':'Put together';
    $('operation-copy').textContent=operation==='take'?'Use the groups to find what remains.':'Bring the two numbers together and build the total.';
    $('operation-symbol').textContent=operation==='take'?'−':'+';$('mental-card').hidden=operation==='put';
    $('guess-input').value='';$('guess-feedback').textContent='';$('algorithm-card').hidden=true;renderOperation();
  }

  function renderOperation() {
    if(!problem)return;
    const {operation,a,b,target}=problem,first=problem.starting,second={hundreds:Math.floor(b/100),tens:Math.floor(b%100/10),ones:b%10};
    const value=answerValue();
    const cell=(place,content,extra='')=>`<div class="operand-cell place-${place} ${extra}">${content}</div>`;
    const operandRow=(label,units,canRegroup=false)=>{
      const h=canRegroup?Array.from({length:units.hundreds},(_,i)=>hundredSvg(78,true,i).replaceAll('data-open-hundred=','data-borrow-hundred=').replace('Open this hundred','Double-click to open this hundred')):hundredsHTML(units.hundreds);
      const t=canRegroup?Array.from({length:Math.ceil(units.tens/5)},(_,row)=>`<div class="count-row tens-row">${Array.from({length:Math.min(5,units.tens-row*5)},(_,i)=>{const index=row*5+i;return tenSvg(42,true,index,i+1).replaceAll('data-open-ten=','data-borrow-ten=');}).join('')}</div>`).join(''):tensHTML(units.tens);
      return `<div class="operand-row ${canRegroup?'regroup-row':''}"><div class="operand-label">${label}</div>${cell('hundreds',h)}${cell('tens',t)}${cell('ones',dotsHTML(units.ones))}</div>`;
    };
    const pendingTen=pending==='ten'?`<svg class="unit-svg pending-unit" data-pending-unit="ten" role="button" tabindex="0" aria-label="Ten dots grouped in Ones. Drag or tap to move to Tens." width="58" height="58" viewBox="0 0 54 54"><circle class="ten-circle" cx="27" cy="27" r="24"/>${dots(27,27,14)}</svg>`:'';
    const pendingHundred=pending==='hundred'?hundredSvg(78,false).replace('class="unit-svg"','class="unit-svg pending-unit" data-pending-unit="hundred"').replace('aria-hidden="true"','role="button" tabindex="0" aria-label="Ten tens grouped in Tens. Drag or tap to move to Hundreds."'):'';
    const addDot=`<button class="row-tool add-tool" data-answer-action="add-dot" ${value>=999?'disabled':''}>＋ Add dot</button>`;
    const undoDot=`<button class="row-tool" data-answer-action="remove-dot" ${answer.ones===0?'disabled':''}>− Remove dot</button>`;
    const groupOnes=`<button class="row-tool" data-answer-action="group-ones" ${answer.ones<10||pending?'disabled':''}>Group 10 dots</button>`;
    const groupTens=`<button class="row-tool" data-answer-action="group-tens" ${answer.tens<10||pending?'disabled':''}>Group 10 tens</button>`;
    const addTen=`<button class="row-tool add-tool" data-answer-action="add-ten" ${value>989?'disabled':''}>＋ Add ten</button>`;
    const addHundred=`<button class="row-tool add-tool" data-answer-action="add-hundred" ${value>899?'disabled':''}>＋ Add hundred</button>`;
    const answerRow=`<div class="operand-row answer-row"><div class="operand-label">Your answer</div><div class="operand-cell place-hundreds drop-cell" data-dropzone="hundred">${hundredsHTML(answer.hundreds)}${addHundred}<span class="drop-hint">Drop hundred here</span></div><div class="operand-cell place-tens drop-cell" data-dropzone="ten">${tensHTML(answer.tens)}${pendingHundred}${addTen}${groupTens}<span class="drop-hint">Drop ten here</span></div><div class="operand-cell place-ones">${dotsHTML(answer.ones)}${pendingTen}${addDot}${undoDot}${groupOnes}</div></div>`;
    const headings='<div class="place-headings"><div></div><div>HUNDREDS</div><div>TENS</div><div>ONES</div></div>';
    const rows=operation==='take'?operandRow(`Starting number · ${a}`,first,true)+operandRow(`Take away · ${b}`,second):operandRow(`First number · ${a}`,first)+operandRow(`Second number · ${b}`,second);
    $('problem-display').innerHTML=`${a} ${operation==='take'?'−':'+'} ${b} <span>= ?</span>`;
    $('take-board').innerHTML=`<div class="operand-board">${headings}${rows}${answerRow}</div>`;
    $('step-badge').textContent='BUILD YOUR ANSWER';$('step-progress').textContent=operation==='take'?'Use both rows to work out what remains.':'Bring both numbers together.';
    $('step-prompt').textContent=pending==='ten'?'You grouped 10 dots into one ten. Drag it from Ones to Tens, or tap it to move.':pending==='hundred'?'You grouped 10 tens into one hundred. Drag it from Tens to Hundreds, or tap it to move.':operation==='take'?'Build the amount left in the third row. Double-click or double-tap a whole ten or hundred in the first row to regroup it.':'Build the total in the third row. Add dots, group ten dots into a ten, then group ten tens into a hundred.';
    const terms=[];if(answer.hundreds)terms.push(`${answer.hundreds} ${answer.hundreds===1?'hundred':'hundreds'}`);if(answer.tens)terms.push(`${answer.tens} ${answer.tens===1?'ten':'tens'}`);if(answer.ones)terms.push(`${answer.ones} ${answer.ones===1?'one':'ones'}`);if(pending)terms.push(pending==='ten'?'1 ten waiting in Ones':'1 hundred waiting in Tens');
    const startTerms=[];if(first.hundreds)startTerms.push(`${first.hundreds} ${first.hundreds===1?'hundred':'hundreds'}`);if(first.tens)startTerms.push(`${first.tens} ${first.tens===1?'ten':'tens'}`);if(first.ones||!startTerms.length)startTerms.push(`${first.ones} ${first.ones===1?'one':'ones'}`);
    const expandedStart=[];if(first.hundreds)expandedStart.push(first.hundreds*100);if(first.tens)expandedStart.push(first.tens*10);if(first.ones||!expandedStart.length)expandedStart.push(first.ones);
    const sourceEquation=operation==='take'?`<span class="written-source"><b>${a} = ${startTerms.join(' + ')}</b><small>${a} = ${expandedStart.join(' + ')}</small></span>`:'';
    const answerEquation=`<span class="written-answer">${terms.length?terms.join(' + '):'Your answer is empty'}${value?' = '+value:''}</span>`;
    $('step-equation').innerHTML=`${sourceEquation}${answerEquation}`;
    $('step-action').innerHTML='<button class="button primary small" id="check-answer">Check answer <span>→</span></button><button class="button soft small" id="clear-answer">Clear answer</button>';
    const showWritten=problem.writtenUnlocked||(operation==='take'&&problem.regrouped);
    $('algorithm-card').hidden=!showWritten;
    if(showWritten)updateWrittenBridge();

    $('take-board').querySelectorAll('[data-answer-action]').forEach(button=>button.addEventListener('click',()=>{
      const action=button.dataset.answerAction;
      if(action==='add-dot'&&value<999)answer.ones++;
      if(action==='add-ten'&&value<=989)answer.tens++;
      if(action==='add-hundred'&&value<=899)answer.hundreds++;
      if(action==='remove-dot'&&answer.ones>0)answer.ones--;
      if(action==='group-ones'&&answer.ones>=10&&!pending){answer.ones-=10;pending='ten';}
      if(action==='group-tens'&&answer.tens>=10&&!pending){answer.tens-=10;pending='hundred';}
      renderOperation();
    }));
    $('clear-answer').addEventListener('click',()=>{answer.hundreds=answer.tens=answer.ones=0;pending=null;$('algorithm-card').hidden=true;renderOperation();});
    $('check-answer').addEventListener('click',()=>{
      if(pending){$('step-progress').textContent='Move the whole group first.';$('step-prompt').textContent=pending==='ten'?'Drag or tap the grouped ten into Tens.':'Drag or tap the grouped hundred into Hundreds.';}
      else if(value===target){$('step-progress').textContent='That matches the two numbers.';$('step-prompt').textContent=`Yes. ${a} ${operation==='take'?'−':'+'} ${b} = ${target}. You built it using place-value groups.`;$('take-reflection').textContent='Can you explain how the groups in your answer match the two rows?';showWrittenBridge();}
      else{$('step-progress').textContent='Keep exploring the groups.';$('step-prompt').textContent='Check the amount you built. Add or remove dots, and regroup complete groups of ten.';}
    });
    $('take-reflection').textContent=operation==='take'?'What could you change without changing the total?':'What could you combine without changing the total?';
    const board=$('take-board');
    const openBorrowUnit=unit=>{
      if(unit.matches('[data-borrow-ten]')&&problem.starting.tens>0){problem.starting.tens--;problem.starting.ones+=10;problem.regrouped=true;renderOperation();}
      else if(unit.matches('[data-borrow-hundred]')&&problem.starting.hundreds>0){problem.starting.hundreds--;problem.starting.tens+=10;problem.regrouped=true;renderOperation();}
    };
    board.ondblclick=e=>{const unit=e.target.closest('[data-borrow-ten],[data-borrow-hundred]');if(unit)openBorrowUnit(unit);};
    let lastTouchUnit=null,lastTouchAt=0;
    board.onpointerup=e=>{
      if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
      const unit=e.target.closest('[data-borrow-ten],[data-borrow-hundred]');if(!unit)return;
      const now=Date.now();if(unit===lastTouchUnit&&now-lastTouchAt<450){lastTouchUnit=null;lastTouchAt=0;openBorrowUnit(unit);}else{lastTouchUnit=unit;lastTouchAt=now;}
    };
    board.onkeydown=e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      const borrow=e.target.closest('[data-borrow-ten],[data-borrow-hundred]');
      if(borrow){e.preventDefault();openBorrowUnit(borrow);return;}
      const unit=e.target.closest('[data-pending-unit]');if(unit){e.preventDefault();movePending(unit.dataset.pendingUnit);}
    };
    board.onpointerdown=e=>{const unit=e.target.closest('[data-pending-unit]');if(!unit)return;e.preventDefault();const rect=unit.getBoundingClientRect(),ghost=unit.cloneNode(true);ghost.classList.add('floating-unit');ghost.style.left=`${rect.left}px`;ghost.style.top=`${rect.top}px`;ghost.style.width=`${rect.width}px`;ghost.style.height=`${rect.height}px`;document.body.appendChild(ghost);unit.style.visibility='hidden';drag={unit,ghost,kind:unit.dataset.pendingUnit,startX:e.clientX,startY:e.clientY};};
    document.onpointermove=e=>{if(!drag)return;drag.ghost.style.left=`${e.clientX-drag.ghost.offsetWidth/2}px`;drag.ghost.style.top=`${e.clientY-drag.ghost.offsetHeight/2}px`;document.querySelectorAll('.drop-cell').forEach(zone=>zone.classList.remove('drop-hover'));const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-dropzone]');if(zone&&zone.dataset.dropzone===drag.kind)zone.classList.add('drop-hover');};
    document.onpointerup=e=>{if(!drag)return;const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-dropzone]'),kind=drag.kind,tapped=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<12;drag.ghost.remove();drag.unit.style.visibility='';document.querySelectorAll('.drop-cell').forEach(item=>item.classList.remove('drop-hover'));drag=null;if(zone&&zone.dataset.dropzone===kind||tapped)movePending(kind);};
  }

  function movePending(kind){if(pending!==kind)return;if(kind==='ten'){pending=null;answer.tens++;}else{pending=null;answer.hundreds++;}renderOperation();}
  function showWrittenBridge(){problem.writtenUnlocked=true;$('algorithm-card').hidden=false;updateWrittenBridge();}
  function updateWrittenBridge(){
    if(!problem)return;
    const {operation,a,b,target,starting}=problem;
    const original={hundreds:Math.floor(a/100),tens:Math.floor(a%100/10),ones:a%10};
    const second={hundreds:Math.floor(b/100),tens:Math.floor(b%100/10),ones:b%10};
    const result={hundreds:Math.floor(target/100),tens:Math.floor(target%100/10),ones:target%10};
    const subDigits={...second};
    for(const place of ['hundreds','tens','ones']){
      const changed=starting[place]!==original[place];
      $(`alg-${place}-mark`).textContent=changed?starting[place]:'';
      const originalDigit=$(`alg-original-${place}`);
      originalDigit.textContent=(place==='hundreds'&&!original.hundreds)||(place==='tens'&&!original.hundreds&&!original.tens)?'':original[place];
      originalDigit.classList.toggle('crossed-out',changed);
      $(`alg-sub-${place}`).textContent=(place==='hundreds'&&!subDigits.hundreds)||(place==='tens'&&!subDigits.hundreds&&!subDigits.tens)?'':subDigits[place];
      $(`alg-answer-${place}`).textContent=(place==='hundreds'&&!result.hundreds)||(place==='tens'&&!result.hundreds&&!result.tens)?'':result[place];
    }
    $('alg-operation-symbol').textContent=operation==='take'?'−':'+';
    $('algorithm-title').textContent=operation==='take'?'We renamed the starting number.':'We combined the groups.';
    if(operation==='take'){
      const parts=[];
      if(starting.hundreds)parts.push(`${starting.hundreds} ${starting.hundreds===1?'hundred':'hundreds'}`);
      if(starting.tens)parts.push(`${starting.tens} ${starting.tens===1?'ten':'tens'}`);
      if(starting.ones||!parts.length)parts.push(`${starting.ones} ${starting.ones===1?'one':'ones'}`);
      $('algorithm-explanation').textContent=`${a} is now ${parts.join(' + ')}. The value stays ${a}.`;
    }else $('algorithm-explanation').textContent=`${a} + ${b} = ${target}. The written columns show the same hundreds, tens, and ones.`;
  }

  $('start-problem').addEventListener('click',()=>startProblem(mode));
  $('minuend-input').addEventListener('keydown',e=>{if(e.key==='Enter')startProblem(mode);});
  $('subtrahend-input').addEventListener('keydown',e=>{if(e.key==='Enter')startProblem(mode);});
  $('check-guess').addEventListener('click',()=>{if(!problem)return;const guess=Number($('guess-input').value);$('guess-feedback').textContent=guess===problem.target?'Yes. Now build it with the place-value groups.':'Thanks for making a guess. Build the answer with the groups and see.';});
  $('skip-guess').addEventListener('click',()=>{$('mental-card').hidden=true;});
  renderBuilder();
})();
