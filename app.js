const urlParams = new URLSearchParams(window.location.search);
const uName = urlParams.get('user') || "Operativec";
const uRoles = (urlParams.get('roles') || "").split(',');

const ROLE_VEDENI = "1258169184592072715";
const ROLE_MAESTRO = "1258169106095673415";

async function loadModule(name, btn) {
    // Označit tlačítko jako aktivní
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    const mainView = document.getElementById('main-view');
    try {
        const resp = await fetch(`${name}.html`);
        mainView.innerHTML = await resp.text();
        
        // Znovu spustit grafy podle toho, co se načetlo
        if(name === 'dossier') initUserCharts();
        if(name === 'management') initOrgCharts();
    } catch(e) {
        mainView.innerHTML = `<div class="card">Chyba při načítání modulu: ${name}</div>`;
    }
}

// Funkce pro zobrazení Role Badge u jména
function setRoleDisplay() {
    const nameElem = document.getElementById('display-name');
    const badgeElem = document.getElementById('display-badge');
    
    nameElem.innerText = uName.toUpperCase();
    
    let label = "OPERATIVEC";
    if (uRoles.includes(ROLE_VEDENI)) label = "VEDENÍ KARTELU";
    else if (uRoles.includes(ROLE_MAESTRO)) label = "MAESTRO";
    
    badgeElem.innerHTML = `<span class="role-badge">${label}</span>`;
    
    // Odemknutí menu pro Vedení
    if (uRoles.includes(ROLE_VEDENI) || uRoles.includes(ROLE_MAESTRO)) {
        document.querySelectorAll('.vedeni-only').forEach(e => e.style.display = 'block');
    }
}

// Spuštění po načtení
window.onload = () => {
    setRoleDisplay();
    startSequence(); // Spustí tvoje původní intro
};

// ... zde nechej své funkce spawnSatellite(), startSequence(), initCharts() atd.
