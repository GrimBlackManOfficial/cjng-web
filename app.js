const urlParams = new URLSearchParams(window.location.search);
const uName = urlParams.get('user') || "Neznámý Operativec";
const uRoles = (urlParams.get('roles') || "").split(',');

// ID tvých rolí z Discordu (uprav podle sebe)
const ROLE_VEDENI = "1468388299642241281"; // Příklad ID role pro Vedení
const ROLE_MAESTRO = "1429877779918491789"; // Příklad ID role pro Maestro

function getRoleLabel() {
    if (uRoles.includes(ROLE_VEDENI)) return "VEDENÍ KARTELU";
    if (uRoles.includes(ROLE_MAESTRO)) return "MAESTRO";
    return "OPERATIVEC";
}

async function loadModule(moduleName, btn) {
    // Aktivní tlačítko
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    const mainView = document.getElementById('main-view');
    const response = await fetch(`${moduleName}.html`);
    const html = await response.text();
    mainView.innerHTML = html;

    if(moduleName === 'dossier') initUserCharts();
}

// FUNKCE PRO REGISTRACI DO SUPABASE
async function registerMember() {
    const discordId = document.getElementById('reg-discord-id').value;
    const fullName = document.getElementById('reg-name').value;

    if(!discordId || !fullName) return alert("Vyplň všechna pole!");

    const { data, error } = await supabase
        .from('zamestnanci') // Název tvé tabulky v Supabase
        .insert([{ user_id: discordId, jmeno_prijmeni: fullName }]);

    if (error) {
        alert("Chyba při registraci: " + error.message);
    } else {
        alert("Operativec zaregistrován. Složka vytvořena.");
        loadModule('management');
    }
}

window.onload = () => {
    document.getElementById('display-name').innerText = uName.toUpperCase();
    document.getElementById('display-badge').innerHTML = `<span class="role-badge">${getRoleLabel()}</span>`;
    
    // Zobrazení tlačítek podle role
    if (uRoles.includes(ROLE_VEDENI) || uRoles.includes(ROLE_MAESTRO)) {
        document.querySelectorAll('.vedeni-only').forEach(e => e.style.display = 'flex');
    }
    
    startIntro();
};
