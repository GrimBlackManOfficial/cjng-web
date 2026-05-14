// Konfigurace z tvého dashboardu
const urlParams = new URLSearchParams(window.location.search);
const uName = urlParams.get('user') || "Neznámý";
const uRoles = (urlParams.get('roles') || "").split(',');

// ROLE ID (Uprav si dle svého Discordu)
const ROLE_VEDENI = "1468388299642241281";
const ROLE_MAESTRO = "1429877779918491789";

// Přepínání modulů
async function loadModule(name, btn) {
    if(btn) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    const resp = await fetch(`${name}.html`);
    document.getElementById('main-view').innerHTML = await resp.text();
    
    if(name === 'dossier') initUserCharts();
    if(name === 'management') initOrgCharts();
}

// TVŮJ PŮVODNÍ SUPABASE REGISTR (Příklad)
async function registerMember() {
    const id = document.getElementById('reg-discord-id').value;
    const name = document.getElementById('reg-name').value;
    // Zde by bylo tvé supabase.from('zamestnanci').insert(...)
    alert(`Registruji: ${name} s ID: ${id}`);
}

// TVÉ PŮVODNÍ SATELITY
function spawnSatellite() {
    const s = document.createElement('div');
    s.className = 'satellite';
    s.style.left = Math.random() * 100 + 'vw';
    s.style.top = Math.random() * 100 + 'vh';
    const tx = (Math.random() - 0.5) * 500;
    const ty = (Math.random() - 0.5) * 500;
    s.style.setProperty('--tx', `${tx}px`);
    s.style.setProperty('--ty', `${ty}px`);
    s.style.animation = `satelliteMove ${3 + Math.random() * 5}s linear forwards`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 8000);
}

// TVÉ GRAFY
function initOrgCharts() {
    const ctx = document.getElementById('orgFinChart');
    if(!ctx) return;
    new Chart(ctx, { type: 'line', data: { labels: ['Po','Út','St','Čt','Pá'], datasets: [{label: 'Příjmy', data: [10,20,15,30,25], borderColor:'#f00'}] } });
}

function initUserCharts() {
    const ctx = document.getElementById('userEarningsChart');
    if(!ctx) return;
    new Chart(ctx, { type: 'bar', data: { labels: ['T1','T2','T3','T4'], datasets: [{label: 'Výplata', data: [1200,1500,1100,1800], backgroundColor:'#f00'}] } });
}

// INTRO SEKVENCE
async function startSequence() {
    const term = document.getElementById('term-content');
    const lines = ["> CONNECTING TO CJNG NETWORK...", "> ENCRYPTION: AES-256 ACTIVE", `> USER: ${uName.toUpperCase()}`, "> ACCESS GRANTED."];
    for(let l of lines) {
        let d = document.createElement('div');
        d.innerHTML = l;
        term.appendChild(d);
        await new Promise(r => setTimeout(r, 400));
    }
    setTimeout(() => {
        document.getElementById('terminal-overlay').style.opacity = '0';
        setTimeout(() => document.getElementById('terminal-overlay').remove(), 1000);
        setInterval(spawnSatellite, 1500);
        loadModule('dossier');
    }, 1000);
}

window.onload = () => {
    document.getElementById('display-name').innerText = uName.toUpperCase();
    const label = uRoles.includes(ROLE_VEDENI) ? "VEDENÍ KARTELU" : (uRoles.includes(ROLE_MAESTRO) ? "MAESTRO" : "OPERATIVEC");
    document.getElementById('display-badge').innerHTML = `<span class="role-badge">${label}</span>`;
    
    if(uRoles.includes(ROLE_VEDENI) || uRoles.includes(ROLE_MAESTRO)) {
        document.querySelectorAll('.vedeni-only, .maestro-only').forEach(e => e.style.display = 'block');
    }
    startSequence();
};
