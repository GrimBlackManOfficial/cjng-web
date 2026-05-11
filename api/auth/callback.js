import { createClient } from '@supabase/supabase-js';

// Inicializace Supabase pomocí proměnných prostředí z Vercelu
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).send('Chybí autorizační kód z Discordu.');

    try {
        // 1. Výměna kódu za Token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const tokens = await tokenResponse.json();
        
        if (!tokens.access_token) {
            return res.status(500).json({ 
                error: "Chyba autentizace", 
                message: "Nepodařilo se získat přístupový klíč od Discordu.",
                details: tokens 
            });
        }

        // 2. Získání základních informací o uživateli (pro ID)
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userData = await userResponse.json();

        // 3. KONTROLA V DATABÁZI KARTELU (SUPABASE)
        const { data: zamestnanec, error: dbError } = await supabase
            .from('zamestnanci')
            .select('*')
            .eq('user_id', userData.id)
            .single();

        if (!zamestnanec) {
            return res.status(403).send(`PŘÍSTUP ODEPŘEN: Uživatel ID ${userData.id} není registrován v databázi kartelu.`);
        }

        // 4. Získání dat člena konkrétního serveru (pro role a nick)
        const guildId = "1417241414693031988"; 
        const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const memberData = await memberResponse.json();

        // Pokud uživatel není na serveru
        if (memberResponse.status === 404) {
            return res.status(403).send(`Přístup odepřen: Uživatel není členem CJNG serveru.`);
        }

        // Logika pro jméno: Priorita je Supabase -> Server Nick -> Discord Name
        const finalNickname = zamestnanec.jmeno_prijmeni || memberData.nick || userData.global_name || userData.username;

        // 5. Přesměrování na Dashboard
        const userEncoded = encodeURIComponent(finalNickname);
        const rolesEncoded = (memberData.roles || []).join(',');
        
        // PŘIDÁVÁME ID PRO FETCHSTATS V DASHBOARDU
        return res.redirect(`/dashboard.html?user=${userEncoded}&roles=${rolesEncoded}&id=${userData.id}`);

    } catch (err) {
        return res.status(500).send("Kritická chyba systému: " + err.message);
    }
}
