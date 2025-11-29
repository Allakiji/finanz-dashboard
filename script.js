// Tab Navigation Logik
function openTab(tabName) {
    // Alle Inhalte verstecken
    const contents = document.getElementsByClassName('tab-content');
    for (let content of contents) {
        content.classList.remove('active');
    }
    // Alle Tabs deaktivieren
    const tabs = document.getElementsByClassName('tab-link');
    for (let tab of tabs) {
        tab.classList.remove('active');
    }
    
    // Gewählten Tab anzeigen
    document.getElementById(tabName).classList.add('active');
    // Button hervorheben (hier vereinfacht über Textsuche oder Index, 
    // in minimalem Code lassen wir das Highlighting der Buttons statisch oder über EventListener)
}

// 1. Homeoffice Rechner
function berechneHomeoffice() {
    const tage = parseFloat(document.getElementById('ho-tage').value);
    const output = document.getElementById('ho-result');
    
    if (!tage) {
        output.style.display = 'none';
        return;
    }

    // Gesetzliche Regelung 2023: Max 210 Tage, 6€ pro Tag
    const anrechenbareTage = Math.min(tage, 210);
    const erstattung = anrechenbareTage * 6;
    
    let text = `Du kannst <strong>${erstattung.toFixed(2)} €</strong> steuerlich geltend machen.`;
    
    if (tage > 210) {
        text += `<br><small>Hinweis: Es werden maximal 210 Tage (1.260€) anerkannt.</small>`;
    }
    
    if (erstattung > 1260) { // Theoretisch durch min() schon abgefangen, aber als Logik-Check
         text += `<br><strong>Tipp:</strong> Bei so hohen Kosten könnte ein separates Arbeitszimmer günstiger sein (falls vorhanden).`;
    }

    output.innerHTML = text;
    output.style.display = 'block';
}

// 2. Strom Rechner
function berechneStrom() {
    const kwh = parseFloat(document.getElementById('strom-kwh').value);
    const preisCent = parseFloat(document.getElementById('strom-preis').value);
    const grundpreis = parseFloat(document.getElementById('strom-grund').value);
    const output = document.getElementById('strom-result');

    if (!kwh || !preisCent) {
        output.style.display = 'none';
        return;
    }

    const arbeitspreisGesamt = kwh * (preisCent / 100);
    const grundpreisGesamt = grundpreis * 12;
    const kostenJahr = arbeitspreisGesamt + grundpreisGesamt;
    const kostenMonat = kostenJahr / 12;

    output.innerHTML = `
        Jahreskosten: <strong>${kostenJahr.toFixed(2)} €</strong><br>
        Monatlicher Abschlag: <strong>${kostenMonat.toFixed(2)} €</strong>
    `;
    output.style.display = 'block';
}

// Hilfsfunktion: Berechnet die Grundsteuer nach §32a EStG 2024
function getEStG(zvE) {
    if (zvE <= 11604) {
        return 0;
    } else if (zvE <= 17005) {
        const y = (zvE - 11604) / 10000;
        return (922.98 * y + 1400) * y;
    } else if (zvE <= 66760) {
        const z = (zvE - 17005) / 10000;
        return (181.19 * z + 2397) * z + 966.53;
    } else if (zvE <= 277825) {
        return 0.42 * zvE - 9972.98;
    } else {
        return 0.45 * zvE - 18307.73;
    }
}

// 3. Steuer Rechner (Mit Klassen & Kirche)
// 3. Steuer Rechner (PROFI VERSION)
// 3. Steuer Rechner (PROFI VERSION + KINDERGELD)
function berechneSteuer() {
    const brutto = parseFloat(document.getElementById('steuer-brutto').value);
    const klasse = parseInt(document.getElementById('steuer-klasse').value);
    const kircheSatz = parseInt(document.getElementById('steuer-kirche').value);
    
    // Sozialversicherung Inputs
    const kvZusatz = parseFloat(document.getElementById('kv-zusatz').value) || 1.7;
    const kinder = parseInt(document.getElementById('kinder-anzahl').value) || 0;
    const isOlder23 = document.getElementById('alter-ueber-23').checked;

    const output = document.getElementById('steuer-result');

    if (!brutto || brutto < 0) {
        output.style.display = 'none';
        return;
    }

    // --- A. SOZIALVERSICHERUNG ---
    const BBG_KV = 62100; 
    const BBG_RV = 90600; 
    
    // 1. KV
    const kvSatzGesamt = 14.6 + kvZusatz;
    const kvBasis = Math.min(brutto, BBG_KV);
    const kvBeitrag = kvBasis * (kvSatzGesamt / 100) * 0.5;

    // 2. RV
    const rvBasis = Math.min(brutto, BBG_RV);
    const rvBeitrag = rvBasis * 0.093; 

    // 3. AV
    const avBeitrag = rvBasis * 0.013; 

    // 4. PV (Pflege)
    let pvSatzAN = 0;
    const pvBasis = Math.min(brutto, BBG_KV);
    if (kinder === 0 && isOlder23) {
        pvSatzAN = 0.023; 
    } else {
        pvSatzAN = 0.017; 
        if (kinder > 1) {
            // PUEG: 0.25% Entlastung ab 2. bis 5. Kind
            const entlastung = Math.min(kinder - 1, 4) * 0.0025;
            pvSatzAN -= entlastung;
        }
    }
    const pvBeitrag = pvBasis * pvSatzAN;

    const sozialabgaben = kvBeitrag + rvBeitrag + avBeitrag + pvBeitrag;

    // --- B. STEUER ---
    const werbungskosten = 1230; 
    let zvE = brutto - werbungskosten - (sozialabgaben * 0.96); 
    
    // Entlastung Alleinerziehende (Klasse 2)
    if (klasse === 2) zvE -= 4260;

    if (zvE < 0) zvE = 0;

    let steuer = 0;
    if (klasse === 3) {
        steuer = getEStG(zvE / 2) * 2;
    } else {
        steuer = getEStG(zvE);
    }
    
    // Annäherung Klasse 5/6
    if (klasse === 5) steuer = steuer * 1.8;
    if (klasse === 6) steuer = steuer * 1.9;

    steuer = Math.floor(steuer);

    // Soli & Kirche
    let kinderfreibetragWirkung = kinder * 9312; 
    let soliBasis = steuer; 
    let soli = 0;
    if (soliBasis > (18130 + (kinder * 3000))) { 
        soli = soliBasis * 0.055;
    }

    let kirchensteuer = 0;
    if (kircheSatz > 0) {
        kirchensteuer = steuer * (kircheSatz / 100);
    }

    const netto = brutto - steuer - soli - kirchensteuer - sozialabgaben;
    const monatNetto = netto / 12;

    // --- C. KINDERGELD BERECHNUNG ---
    // Stand 2025: 250 € pro Kind
    const kindergeldMonat = kinder * 250;
    
    // Gesamt verfügbar
    const gesamtVerfuegbar = monatNetto + kindergeldMonat;

    // Text Unterscheidung je nach Steuerklasse (Status)
    let statusText = "";
    if (klasse === 1 || klasse === 2 || klasse === 6) {
        statusText = "Gesamtbudget (Single/Alleinerz.)";
    } else {
        statusText = "Haushaltskasse (inkl. Kindergeld)";
    }

    // --- D. AUSGABE ---
    output.innerHTML = `
        <table style="width:100%; border-collapse: collapse; font-size: 0.95rem;">
            <tr>
                <td style="padding:5px 0;">Brutto (Jahr):</td>
                <td style="text-align:right; font-weight:bold;">${brutto.toLocaleString('de-DE')} €</td>
            </tr>
            <tr>
                <td style="padding:5px 0; color:#e67e22;">- Sozialabgaben:</td>
                <td style="text-align:right; color:#e67e22;">${sozialabgaben.toLocaleString('de-DE', {maximumFractionDigits:2})} €</td>
            </tr>
            
            <tr style="border-top:1px solid #eee;">
                <td style="padding:5px 0; color:#e74c3c;">- Steuern:</td>
                <td style="text-align:right; color:#e74c3c;">${(steuer + soli + kirchensteuer).toLocaleString('de-DE', {maximumFractionDigits:2})} €</td>
            </tr>
            
            <tr style="border-top: 2px solid #ddd; font-weight:bold; background:#f9f9f9;">
                <td style="padding:8px 0;">Gehalt Netto (Monat):</td>
                <td style="text-align:right;">${monatNetto.toLocaleString('de-DE', {maximumFractionDigits:2})} €</td>
            </tr>

            ${kinder > 0 ? `
            <tr style="color:#2980b9;">
                <td style="padding:5px 0;">+ Kindergeld (${kinder} x 250€):</td>
                <td style="text-align:right;">${kindergeldMonat.toLocaleString('de-DE', {maximumFractionDigits:2})} €</td>
            </tr>
            <tr style="border-top: 2px solid #2c3e50; font-weight:bold; font-size: 1.2em; color:#27ae60; background:#e8f8f5;">
                <td style="padding:10px 0;">${statusText}:</td>
                <td style="text-align:right;">${gesamtVerfuegbar.toLocaleString('de-DE', {maximumFractionDigits:2})} €</td>
            </tr>
            ` : `
            <tr style="border-top: 2px solid #2c3e50; font-weight:bold; font-size: 1.2em; color:#27ae60; background:#e8f8f5;">
                <td style="padding:10px 0;">Verfügbar (Monat):</td>
                <td style="text-align:right;">${monatNetto.toLocaleString('de-DE', {maximumFractionDigits:2})} €</td>
            </tr>
            `}
        </table>
        
        ${kinder > 0 && (klasse === 3 || klasse === 4 || klasse === 5) ? 
        '<p style="font-size:0.8rem; color:#777; margin-top:5px;">Hinweis: Bei Verheirateten fließt das Kindergeld in die gemeinsame Haushaltskasse.</p>' : ''}
    `;
    output.style.display = 'block';
}

function datenLaden() {
    const savedData = localStorage.getItem('finanzDaten');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        document.getElementById('ho-tage').value = data.hoTage || '';
        document.getElementById('strom-kwh').value = data.stromKwh || '';
        document.getElementById('strom-preis').value = data.stromPreis || '';
        document.getElementById('strom-grund').value = data.stromGrund || '';
        document.getElementById('steuer-brutto').value = data.steuerBrutto || '';
        
        // Trigger calculations
        if(data.hoTage) berechneHomeoffice();
        if(data.stromKwh) berechneStrom();
        
        const msg = document.getElementById('storage-msg');
        msg.textContent = "✅ Daten geladen.";
    } else {
        alert("Keine gespeicherten Daten gefunden.");
    }
}

// --- ZUSATZ: RÜCKERSTATTUNGS-RECHNER ---

function toggleRefund() {
    const area = document.getElementById('refund-area');
    area.style.display = (area.style.display === 'none') ? 'block' : 'none';
}

function importHomeoffice() {
    const hoTage = document.getElementById('ho-tage').value;
    if(hoTage) {
        document.getElementById('ref-ho').value = hoTage;
    } else {
        alert("Bitte erst im Homeoffice-Tab Tage eingeben!");
    }
}

function berechneRueckerstattung() {
    const brutto = parseFloat(document.getElementById('steuer-brutto').value);
    const klasse = parseInt(document.getElementById('steuer-klasse').value);
    
    // Eingaben für Absetzungen
    const km = parseFloat(document.getElementById('ref-km').value) || 0;
    const arbeitsmittel = parseFloat(document.getElementById('ref-mittel').value) || 0;
    let hoTage = parseFloat(document.getElementById('ref-ho').value) || 0;

    const output = document.getElementById('refund-result');

    if (!brutto) {
        output.innerHTML = "Bitte oben erst ein Brutto-Gehalt eingeben.";
        output.style.display = "block";
        return;
    }

    // 1. Ursprüngliche Steuerlast berechnen (Status Quo)
    // Wir nutzen hier die gleiche Logik wie oben, aber brauchen den exakten Wert
    const pauschaleWerbungskosten = 1230;
    const vorsorge = brutto * 0.21;
    let zvE_original = brutto - pauschaleWerbungskosten - vorsorge;
    if (klasse === 2) zvE_original -= 4260; 
    if (zvE_original < 0) zvE_original = 0;
    
    let steuer_original = 0;
    if (klasse === 3) {
        steuer_original = getEStG(zvE_original / 2) * 2;
    } else {
        steuer_original = getEStG(zvE_original);
    }

    // 2. Tatsächliche Werbungskosten berechnen
    // Pendlerpauschale: 0.30€ für erste 20km, 0.38€ ab km 21. (Pro Arbeitstag ca. 220 Tage)
    const arbeitstage = 220 - hoTage; // Einfache Annahme: Wer Homeoffice macht, fährt nicht
    if (hoTage > 210) hoTage = 210; // Deckelung
    
    let fahrtkosten = 0;
    if (km <= 20) {
        fahrtkosten = km * 0.30 * arbeitstage;
    } else {
        fahrtkosten = (20 * 0.30 * arbeitstage) + ((km - 20) * 0.38 * arbeitstage);
    }
    
    const hoKosten = hoTage * 6; // 6 Euro pro Tag
    
    const tatsaechlicheKosten = fahrtkosten + hoKosten + arbeitsmittel;
    
    // 3. Lohnt es sich?
    let text = "";
    let erstattung = 0;

    if (tatsaechlicheKosten > pauschaleWerbungskosten) {
        // JA! Wir rechnen neu mit den höheren Kosten
        let zvE_neu = brutto - tatsaechlicheKosten - vorsorge;
        if (klasse === 2) zvE_neu -= 4260;
        if (zvE_neu < 0) zvE_neu = 0;
        
        let steuer_neu = 0;
        if (klasse === 3) {
            steuer_neu = getEStG(zvE_neu / 2) * 2;
        } else {
            steuer_neu = getEStG(zvE_neu);
        }
        
        erstattung = steuer_original - steuer_neu;
        
        text = `
            <strong>Glückwunsch! Deine Absetzungen lohnen sich.</strong><br>
            Deine Werbungskosten (${tatsaechlicheKosten.toFixed(2)} €) liegen über der Pauschale von 1.230 €.<br><br>
            Geschätzte Rückerstattung: <span style="font-size:1.4em; color:#27ae60;">+ ${erstattung.toFixed(2)} €</span>
            <br><small>(Differenz zwischen gezahlter Lohnsteuer und tatsächlicher Steuerschuld)</small>
        `;
    } else {
        // NEIN, Pauschale ist besser
        text = `
            <strong>Aktuell lohnt sich das Absetzen kaum.</strong><br>
            Deine berechneten Kosten (${tatsaechlicheKosten.toFixed(2)} €) sind niedriger als die automatische Pauschale von 1.230 €.<br>
            Das Finanzamt zieht automatisch den günstigeren Pauschbetrag ab.
            <br><br>
            <small>Tipp: Hast du Handwerkerkosten oder Spenden vergessen? Die zählen extra!</small>
        `;
    }

    output.innerHTML = text;
    output.style.display = 'block';
}