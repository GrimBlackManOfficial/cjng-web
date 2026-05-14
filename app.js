// app.js
const urlParams = new URLSearchParams(window.location.search);
const uName = urlParams.get('user') || "Neznámý";
const uRoles = (urlParams.get('roles') || "").split(',');

// Funkce pro načítání modulů
async function loadModule(moduleName) {
    const mainView = document.getElementById('main-view');
    const response = await fetch(`${moduleName}.html`);
    const html = await response.text();
    mainView.innerHTML = html;

    // Inicializace grafů po načtení
    if(moduleName === 'dossier') initUserCharts();
    if(moduleName === 'management') initOrgCharts();
}

function initUserCharts() {
    const ctx = document.getElementById('userEarningsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Týden 1', 'Týden 2', 'Týden 3', 'Týden 4'],
            datasets: [{ label: 'Výplata $', data: [1200, 1500, 1100, 1800], backgroundColor: '#ff0000' }]
        }
    });
}

function initOrgCharts() {
    const ctx = document.getElementById('orgFinChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
            datasets: [
                { label: 'Výdaje', data: [10, 25, 15, 30, 45], borderColor: '#f00' },
                { label: 'Výdělky', data: [50, 80, 60, 90, 120], borderColor: '#0f0' }
            ]
        }
    });
}

// Intro Animace
async function startIntro() {
    const term = document.getElementById('term-content');
    const lines = ["> CONNECTING...", "> ACCESS GRANTED.", `> WELCOME: ${uName.toUpperCase()}`];
    for(let line of lines) {
        let d = document.createElement('div');
        d.innerHTML = line;
        term.appendChild(d);
        await new Promise(r => setTimeout(r, 500));
    }
    setTimeout(() => {
        document.getElementById('terminal-overlay').style.opacity = '0';
        setTimeout(() => document.getElementById('terminal-overlay').remove(), 1000);
        loadModule('dossier'); // Načte základní stránku
    }, 1000);
}

// Nastavení Sidebar a start
window.onload = () => {
    document.getElementById('display-name').innerText = uName.toUpperCase();
    // Tady by byla tvá logika pro kontrolu rolí
    document.querySelectorAll('.vedeni-only').forEach(e => e.style.display = 'block'); 
    startIntro();
};
