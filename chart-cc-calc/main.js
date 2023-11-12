// show/hide notes
const declutterButton = document.getElementById("input-declutter");
declutterButton.addEventListener('change', declutterNotes);
function declutterNotes(e) {
    console.log(e);
    const notesAll = document.getElementsByClassName('note');
    for(const noteEl of notesAll){
        noteEl.classList.toggle("hidden");
    }
}
window.addEventListener("load", declutterNotes);


// generate radio groups for chart level
const lvCCs = [ '1', '2', '3', '4', '5', '6', '7',
                '8', '9', '9.7', '10', '10.7', '11', '12'];

const minScoreDiv = document.getElementById("input-lv");
minScoreDiv.innerHTML = '\n\t' + lvCCs.map((lvcc) => `<div class="rb">\n`
    + `\t\t<label><input type="radio" name="lvcc" value="${lvcc}">${ccToLv(lvcc)}</label>\n\t</div>`).join('\n\t') + '\n';

// event listener for chart level change event
const radioButtonsChart = document.querySelectorAll('input[name="lvcc"]');
for(const radioButton of radioButtonsChart){
    radioButton.addEventListener('change', updateMinScore);
}

function ccToLv(cc) {
    if (cc.includes('.')) {
        let baseLv = parseInt(cc);
        let lvDp = parseInt(cc.split('.')[0]);
        if (lvDp >= 7) {
            return parseInt(cc) + '+';
        } else {
            return cc;  
        }          
    } else {
        return cc;
    }   
}

function ccToMinScore(cc) {
    let sm = -parseFloat(cc);
    let sc = 0;
    if (sm >= 2) {
        sc = 10000000;
    } else if (sm >= 1) {
        sc = (sm-1)*200000 + 9800000;
    } else {
        sc = sm*300000 + 9500000;
    }
    return parseInt(sc);
}

function scoreToScoreMod(sc) {
    if (sc >= 10000000) {
        return 2;
    } else if (sc > 9800000) {
        return 1 + (sc-9800000)/200000;
    } else {
        return (sc-9500000)/300000;
    }
}

function scoreDisp(score) {
    let mill = Math.floor(score/1000000);
    let thou = Math.floor((score%1000000)/1000);
    let ones = score%1000;
    return mill + "'" + String(thou).padStart(3,'0') + "'" + String(ones).padStart(3,'0');
}

function updateMinScore(e) {
    console.log(e);
    if (this.checked) {
        document.getElementById('minscorereq').innerText = `${scoreDisp(ccToMinScore(this.value))}`;
    }
}

const minCcEl = document.getElementById("ccmin");
const maxCcEl = document.getElementById("ccmax");
const minCcRndEl = document.getElementById("ccminrnd");
const maxCcRndEl = document.getElementById("ccmaxrnd");

const partnerStepInput = document.getElementById("input-partnerstep");
const partnerLvInput = document.getElementById("input-partnerlv");
const partnerNonmaxInput = document.getElementById("input-partnernonmax");
const errStpUInput = document.getElementById("input-errstpu");
const errMsg = document.getElementById("calcerror");

// event listener to decrease STEP upper error for certain partners
partnerStepInput.addEventListener("change", updateStpUError);
partnerLvInput.addEventListener("change", updateStpUError);
partnerNonmaxInput.addEventListener("change", updateStpUError);
const errStpUDefault = 1;
const errStpUHighLv = 0.5;
const errStpUSpecial = 0;
const errStpUSealed = 0;

function updateStpUError(e) {
    console.log(e);
    if (partnerStepInput.value >= 160) {
        errStpUInput.setAttribute('value', errStpUSpecial);
    } else if (partnerLvInput.checked && !partnerNonmaxInput.checked) {
        errStpUInput.setAttribute('value', errStpUHighLv);
    } else if (partnerStepInput.value == 50) {
        errStpUInput.setAttribute('value', errStpUSealed);
    } else {
        errStpUInput.setAttribute('value', errStpUDefault);
    }
}

// event listener to calculate CCs on button press
function updateCCs() {
    var stepstat = parseInt(document.getElementById("input-partnerstep").value);
    var stamboost = parseInt(document.querySelector('input[name="stam"]:checked').value);
    var fragboost = parseFloat(document.querySelector('input[name="frag"]:checked').value);
    var score = parseInt(document.getElementById("input-score").value);
    var mapprog = parseFloat(document.getElementById("input-mapprog").value);
    var errmpl = parseFloat(document.getElementById("input-errmpl").value);
    var errmpu = parseFloat(document.getElementById("input-errmpu").value);
    var errstpl = parseFloat(document.getElementById("input-errstpl").value);
    var errstpu = parseFloat(document.getElementById("input-errstpu").value);

    let legacymult = stamboost * fragboost;
    let mincc = calcCC(mapprog-errmpl, score+1, stepstat+errstpu, legacymult);
    let maxcc = calcCC(mapprog+errmpu, score, stepstat-errstpl, legacymult);
    minCcEl.innerText = mincc.toFixed(3);
    maxCcEl.innerText = (maxcc+0.001).toFixed(3);

    let minccrnd = 0;
    let maxccrnd = 0;
    if (mincc < 8) {
        minccrnd = Math.ceil(mincc*2)/2;
    } else {
        minccrnd = Math.ceil(mincc*10)/10;
    }
    if (maxcc < 8) {
        maxccrnd = Math.floor(maxcc*2)/2;
    } else {
        maxccrnd = Math.floor(maxcc*10)/10;
    }
    minCcRndEl.innerText = minccrnd.toFixed(1);
    maxCcRndEl.innerText = maxccrnd.toFixed(1);

    if (minccrnd > maxccrnd) {
        errMsg.innerText = "Invalid min/max estimates. Check your inputs.";
    } else if (minccrnd < maxccrnd) {
        errMsg.innerText = "Error margin between lower/upper bounds is too large to determine the chart constant. Try again with a different Partner or lower score (see notes/tips at the top).";
    } else {
        errMsg.innerText = "";
    }
}

function calcCC(mapprog, score, stepstat, legacymult) {
    let stepbase = mapprog/legacymult/stepstat*50;
    let playrating = ((stepbase-2.5)/2.45)**2;
    return playrating - scoreToScoreMod(score);
}