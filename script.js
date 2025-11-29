// Tab Navigation Logik
function openTab(tabName) {
    const contents = document.getElementsByClassName('tab-content');
    for (let content of contents) {
        content.classList.remove('active');
    }
    const tabs = document.getElementsByClassName('tab-link');
    for (let tab of tabs) {
        tab.classList.remove('active');
    }
    document.getElementById(tabName).classList.add('active');
    
    // Aktiven Button hervorheben
    const buttons = document.querySelectorAll('.tab-link');
    buttons.forEach(btn => {
        if(btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });
}

// 1. Homeoffice Rechner
function berechneHomeoffice() {
    const tage = parseFloat(document.getElementById('ho-tage').value);
    const output = document.getElementById('ho-result');
    
    if (!tage) {
        output.style.display = 'none';
        return;
    }

    const anrechenbareTage = Math.min(tage, 210);
    const erstattung = anrechenbareTage * 6;
    
    let text = `Du kannst <strong>${erstattung.toFixed(2)} €</strong> steuerlich geltend machen.`;
    
    if (tage > 210) {
        text += `<br><small>Hinweis: Es werden maximal 210 Tage (1.260€) anerkannt.</small>`;
    }
    if (erstattung > 1260) {
         text += `<br><strong>Tipp:</strong> Bei so hohen Kosten könnte ein separates Arbeitszimmer günstiger sein.`;
    }

    output.innerHTML = text;
    output.style.display = 'block';
}

// --- STROM RECHNER MIT WECHSEL-LOGIK ---

let currentPersonProfile = 0;

function setStromProfile(personen) {
    currentPersonProfile = personen;
    updateStromProfile();
    const buttons = document.querySelectorAll('.profile-btn');
    buttons.forEach((btn, index) => {
        if (index + 1 === personen) btn.classList.add('active-profile');
        else btn.classList.remove('active-profile');
    });
}

function updateStromProfile() {
    if (currentPersonProfile === 0) return;
    const mitWasser = document.getElementById('strom-wasser').checked;
    let kwh = 0;
    // Durchschnittswerte Stromspiegel 2024
    if (currentPersonProfile === 1) kwh = mitWasser ? 2000 : 1300;
    else if (currentPersonProfile === 2) kwh = mitWasser ? 3500 : 2500;
    else if (currentPersonProfile === 3) kwh = mitWasser ? 4250 : 3200;
    else kwh = mitWasser ? 5000 : 4000;
    document.getElementById('strom-kwh').value = kwh;
    berechneStrom();
}

function berechneStrom() {
    const kwh = parseFloat(document.getElementById('strom-kwh').value);
    const preisCent = parseFloat(document.getElementById('strom-preis').value);
    const grundpreis = parseFloat(document.getElementById('strom-grund').value);
    const plz = document.getElementById('strom-plz').value; // PLZ holen
    const output = document.getElementById('strom-result');
    const tarifArea = document.getElementById('tarif-check-area');

    if (!kwh || !preisCent) {
        output.style.display = 'none';
        tarifArea.style.display = 'none';
        return;
    }

    // 1. IST-Kosten
    const arbeitspreisGesamt = kwh * (preisCent / 100);
    const grundpreisGesamt = grundpreis * 12;
    const kostenJahr = arbeitspreisGesamt + grundpreisGesamt;
    const kostenMonat = kostenJahr / 12;

    output.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
                <span style="color:#777; font-size:0.9rem;">Abschlag aktuell:</span><br>
                <span style="font-size:1.8rem; font-weight:bold; color:#2c3e50;">${kostenMonat.toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2})} €</span>
            </div>
            <div style="text-align:right;">
                <span style="color:#777; font-size:0.9rem;">Jahreskosten:</span><br>
                <span style="font-size:1.2rem; font-weight:bold;">${kostenJahr.toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2})} €</span>
            </div>
        </div>
        <hr style="margin:10px 0; border-color:#eee;">
        <p style="margin:0; font-size:0.85rem; color:#666;">
            Davon Grundgebühr: <strong>${grundpreisGesamt.toFixed(2)} €</strong> (${((grundpreisGesamt/kostenJahr)*100).toFixed(1)}%)
        </p>
    `;
    output.style.display = 'block';

    // 2. CHART
    const chartContainer = document.getElementById('strom-chart-container');
    chartContainer.style.display = 'block';
    const ctx = document.getElementById('stromChart').getContext('2d');
    if (window.myStromChart) window.myStromChart.destroy();
    window.myStromChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Grundgebühr', 'Verbrauch'],
            datasets: [{
                data: [grundpreisGesamt, arbeitspreisGesamt],
                backgroundColor: ['#95a5a6', '#f1c40f'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' }, title: { display: false } }
        }
    });

    // 3. TARIF-CHECK & WECHSEL-LOGIK
    // Annahme: Marktpreis Neukunden ca. 26 Cent
    const marktPreisNeu = 26.0; 
    
    if (preisCent > (marktPreisNeu + 1)) {
        const ersparnis = kwh * ((preisCent - marktPreisNeu) / 100);
        
        // Check24 Deep Link
        const targetPlz = plz || "";
        const vergleichsLink = `https://www.check24.de/strom/vergleich/check24/?total_consumption=${kwh}&zipcode=${targetPlz}&output=calculation`;

        tarifArea.innerHTML = `
            <h4 style="margin:0 0 10px 0; color:#27ae60;">💰 Spar-Alarm!</h4>
            <p style="font-size:0.95rem; margin-bottom:15px;">
                Du zahlst <strong>${preisCent} Ct/kWh</strong>. Neukunden zahlen aktuell oft nur ca. <strong>${marktPreisNeu} Ct/kWh</strong>.
                <br>Mögliches Sparpotenzial:
            </p>
            <div style="font-size:2rem; font-weight:bold; color:#27ae60; margin-bottom:15px;">
                ca. ${ersparnis.toLocaleString('de-DE', {maximumFractionDigits:0})} € / Jahr
            </div>
            
            <a href="${vergleichsLink}" target="_blank" style="display:inline-block; background:#ff9f00; color:#fff; padding:12px 20px; text-decoration:none; border-radius:5px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2);">
                🔎 Tarife in ${targetPlz || "deiner Region"} vergleichen
            </a>
            <p style="font-size:0.7rem; color:#999; margin-top:10px;">
                *Link öffnet Check24. Berechnung basiert auf Markt-Durchschnitt.
            </p>
        `;
        tarifArea.style.display = 'block';
        tarifArea.style.borderColor = "#27ae60";
        tarifArea.style.boxShadow = "0 4px 15px rgba(39, 174, 96, 0.15)";
    } else {
        tarifArea.innerHTML = `
            <h4 style="margin:0 0 5px 0; color:#2980b9;">👍 Guter Tarif!</h4>
            <p style="font-size:0.9rem; margin:0;">
                Dein Preis von <strong>${preisCent} Ct/kWh</strong> ist aktuell fair.
            </p>
        `;
        tarifArea.style.display = 'block';
        tarifArea.style.borderColor = "#3498db";
        tarifArea.style.boxShadow = "none";
    }
}

// Einzelgeräte Rechner
function berechneGeraet() {
    const watt = parseFloat(document.getElementById('device-watt').value);
    const hours = parseFloat(document.getElementById('device-hours').value);
    const preisCent = parseFloat(document.getElementById('strom-preis').value) || 35; // Fallback 35 Cent
    
    const output = document.getElementById('device-result');

    if(!watt || !hours) return;

    // Berechnung: Watt * Stunden * 365 Tage / 1000 (für kWh) * Preis
    const kwhJahr = (watt * hours * 365) / 1000;
    const kostenJahr = kwhJahr * (preisCent / 100);

    output.innerHTML = `
        Dieses Gerät verbraucht ca. <strong>${kwhJahr.toLocaleString('de-DE', {maximumFractionDigits:0})} kWh</strong> pro Jahr.<br>
        Kostenfaktor: <strong style="color:#e67e22; font-size:1.2rem;">${kostenJahr.toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2})} € / Jahr</strong>
        <br><small>(Bei einem Strompreis von ${preisCent} Cent/kWh)</small>
    `;
    output.style.display = 'block';
}

// Balkonkraftwerk Rechner
function berechneSolar() {
    const erzeugung = parseFloat(document.getElementById('solar-kwh').value);
    const preisCent = parseFloat(document.getElementById('strom-preis').value) || 35;
    
    const output = document.getElementById('solar-result');
    
    if(!erzeugung) return;

    const ersparnis = erzeugung * (preisCent / 100);
    // Amortisation grob schätzen (Annahme: Set kostet 400€)
    const setPreis = 400;
    const jahre = setPreis / ersparnis;

    output.innerHTML = `
        Du sparst jährlich: <strong style="color:#27ae60; font-size:1.2rem;">${ersparnis.toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2})} €</strong>
        <br><small>Bei Anschaffungskosten von ca. 400€ hättest du das Geld in <strong>${jahre.toFixed(1)} Jahren</strong> wieder drin!</small>
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

// 3. Steuer Rechner (PROFI VERSION + KINDERGELD + GRAFIK)
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
            const entlastung = Math.min(kinder - 1, 4) * 0.0025;
            pvSatzAN -= entlastung;
        }
    }
    const pvBeitrag = pvBasis * pvSatzAN;

    const sozialabgaben = kvBeitrag + rvBeitrag + avBeitrag + pvBeitrag;

    // --- B. STEUER ---
    const werbungskosten = 1230; 
    let zvE = brutto - werbungskosten - (sozialabgaben * 0.96); 
    
    if (klasse === 2) zvE -= 4260;
    if (zvE < 0) zvE = 0;

    let steuer = 0;
    if (klasse === 3) {
        steuer = getEStG(zvE / 2) * 2;
    } else {
        steuer = getEStG(zvE);
    }
    
    if (klasse === 5) steuer = steuer * 1.8;
    if (klasse === 6) steuer = steuer * 1.9;

    steuer = Math.floor(steuer);

    // Soli & Kirche
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

    // --- C. KINDERGELD ---
    const kindergeldMonat = kinder * 250;
    const gesamtVerfuegbar = monatNetto + kindergeldMonat;
    
    let statusText = "Verfügbar (Monat)";
    if (kinder > 0) {
         if (klasse === 1 || klasse === 2 || klasse === 6) {
            statusText = "Gesamtbudget (Single/Alleinerz.)";
        } else {
            statusText = "Haushaltskasse (inkl. Kindergeld)";
        }
    }

    // --- D. AUSGABE TABELLE ---
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
                <td style="padding:10px 0;">Netto (Monat):</td>
                <td style="text-align:right;">${monatNetto.toLocaleString('de-DE', {maximumFractionDigits:2})} €</td>
            </tr>
            `}
        </table>
        ${kinder > 0 && (klasse >= 3 && klasse <= 5) ? '<p style="font-size:0.8rem; color:#777; margin-top:5px;">Hinweis: Kindergeld zählt zum Haushalt.</p>' : ''}
    `;
    output.style.display = 'block';

    // --- E. GRAFIK ZEICHNEN (Chart.js) ---
    // Hier wird das Diagramm aktiviert
    const chartContainer = document.getElementById('chart-container');
    if(chartContainer) {
        chartContainer.style.display = 'block';

        const ctx = document.getElementById('steuerChart').getContext('2d');

        if (window.mySteuerChart) {
            window.mySteuerChart.destroy();
        }

        window.mySteuerChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Netto', 'Lohnsteuer', 'Sozialabgaben', 'Kirche/Soli'],
                datasets: [{
                    data: [netto, steuer, sozialabgaben, (kirchensteuer + soli)],
                    backgroundColor: ['#27ae60', '#e74c3c', '#f39c12', '#8e44ad'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Wohin dein Brutto-Gehalt fließt' }
                }
            }
        });
    }
}

// 4. Rückerstattung (Feature)
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

// 4. Rückerstattung (PROFI VERSION)
function berechneRueckerstattung() {
    const brutto = parseFloat(document.getElementById('steuer-brutto').value);
    const klasse = parseInt(document.getElementById('steuer-klasse').value);
    
    // Inputs holen
    // 1. Werbungskosten
    const km = parseFloat(document.getElementById('ref-km').value) || 0;
    const arbeitsmittel = parseFloat(document.getElementById('ref-mittel').value) || 0;
    let hoTage = parseFloat(document.getElementById('ref-ho').value) || 0;
    const fortbildung = parseFloat(document.getElementById('ref-fortbildung').value) || 0;
    const kontofuehrung = parseFloat(document.getElementById('ref-konto').value) || 0;

    // 2. Handwerker & Co (§35a EStG)
    const handwerker = parseFloat(document.getElementById('ref-handwerker').value) || 0;
    const dienstleister = parseFloat(document.getElementById('ref-dienstleister').value) || 0;

    // 3. Sonderausgaben
    const spenden = parseFloat(document.getElementById('ref-spenden').value) || 0;
    // Versicherungen lassen wir im MVP weg, da meist durch Vorsorgepauschale abgedeckt

    const output = document.getElementById('refund-result');

    if (!brutto) {
        output.innerHTML = "Bitte oben erst ein Brutto-Gehalt eingeben.";
        output.style.display = "block";
        return;
    }

    // --- SCHRITT 1: BASISWERTE BERECHNEN (Wie beim Netto-Rechner) ---
    // Wir nutzen vereinfacht die Standard-Werte für eine Vergleichsrechnung
    const pauschaleWerbungskosten = 1230;
    // Vorsorgeaufwendungen (Sozialabgaben) schätzen wir wieder
    const vorsorge = brutto * 0.21; 
    
    // Original zvE (Zu versteuerndes Einkommen) mit Standard-Pauschale
    let zvE_original = brutto - pauschaleWerbungskosten - vorsorge;
    if (klasse === 2) zvE_original -= 4260; 
    if (zvE_original < 0) zvE_original = 0;
    
    let steuer_original = 0;
    if (klasse === 3) steuer_original = getEStG(zvE_original / 2) * 2;
    else steuer_original = getEStG(zvE_original);


    // --- SCHRITT 2: NEUE STEUERLAST BERECHNEN ---
    
    // A. Werbungskosten summieren
    const arbeitstage = 220 - hoTage; 
    if (hoTage > 210) hoTage = 210;
    
    let fahrtkosten = 0;
    if (km <= 20) {
        fahrtkosten = km * 0.30 * arbeitstage;
    } else {
        fahrtkosten = (20 * 0.30 * arbeitstage) + ((km - 20) * 0.38 * arbeitstage);
    }
    const hoKosten = hoTage * 6;
    
    const werbungskostenSumme = fahrtkosten + hoKosten + arbeitsmittel + fortbildung + kontofuehrung;
    
    // Check: Ist Summe höher als Pauschale?
    const anzusetzendeWerbungskosten = Math.max(werbungskostenSumme, pauschaleWerbungskosten);

    // B. Sonderausgaben abziehen (Spenden)
    // Spenden mindern das zvE direkt
    
    // Neues zvE berechnen
    let zvE_neu = brutto - anzusetzendeWerbungskosten - vorsorge - spenden;
    if (klasse === 2) zvE_neu -= 4260;
    if (zvE_neu < 0) zvE_neu = 0;

    let steuer_neu = 0;
    if (klasse === 3) steuer_neu = getEStG(zvE_neu / 2) * 2;
    else steuer_neu = getEStG(zvE_neu);


    // --- SCHRITT 3: DIREKTE STEUERABZÜGE (§35a) ---
    // Handwerker: 20% der Lohnkosten
    const bonusHandwerker = handwerker * 0.20;
    // Dienstleister: 20% der Kosten
    const bonusDienstleister = dienstleister * 0.20;
    
    const direktAbzug = bonusHandwerker + bonusDienstleister;
    
    // Endgültige Steuer nach Bonus
    steuer_neu = steuer_neu - direktAbzug;
    if (steuer_neu < 0) steuer_neu = 0; // Man kriegt maximal alles wieder, nicht mehr.


    // --- SCHRITT 4: ERGEBNIS ---
    const erstattung = steuer_original - steuer_neu;
    
    let text = "";
    
    if (erstattung > 0) {
        text = `
            <h3 style="margin-top:0; color:#27ae60;">💰 + ${erstattung.toFixed(2)} € Rückerstattung</h3>
            <p>Das lohnt sich! Hier ist deine Aufschlüsselung:</p>
            <ul style="text-align:left; font-size:0.9rem; padding-left:20px;">
                <li>Steuervorteil durch Werbungskosten/Spenden: <strong>${(steuer_original - (steuer_neu + direktAbzug)).toFixed(2)} €</strong></li>
                ${direktAbzug > 0 ? `<li>Direktabzug Handwerker/Dienstl.: <strong>${direktAbzug.toFixed(2)} €</strong></li>` : ''}
            </ul>
            
            ${werbungskostenSumme > pauschaleWerbungskosten 
                ? `<p style="color:#2ecc71;">✅ Deine Werbungskosten (${werbungskostenSumme.toFixed(2)}€) liegen über der Pauschale.</p>` 
                : `<p style="color:#f39c12;">ℹ️ Deine Werbungskosten liegen noch unter der Pauschale (1.230€). Der Gewinn kommt hier durch Spenden oder Handwerker.</p>`}
        `;
    } else {
         text = `
            <strong>Aktuell keine zusätzliche Erstattung.</strong><br>
            Deine eingetragenen Kosten reichen noch nicht aus, um die Standard-Pauschalen zu schlagen.
            <br><small>Tipp: Handwerkerrechnungen (nur Arbeitslohn) vergessen?</small>
        `;
    }

    output.innerHTML = text;
    output.style.display = 'block';
}

// 5. Profil Speichern (Local Storage)
function datenSpeichern() {
    const data = {
        hoTage: document.getElementById('ho-tage').value,
        stromKwh: document.getElementById('strom-kwh').value,
        stromPreis: document.getElementById('strom-preis').value,
        stromGrund: document.getElementById('strom-grund').value,
        steuerBrutto: document.getElementById('steuer-brutto').value,
        steuerKlasse: document.getElementById('steuer-klasse').value,
        kinderAnzahl: document.getElementById('kinder-anzahl').value
    };

    localStorage.setItem('finanzDaten', JSON.stringify(data));
    
    const msg = document.getElementById('storage-msg');
    msg.textContent = "✅ Daten erfolgreich gespeichert!";
    setTimeout(() => msg.textContent = "", 3000);
}

function datenLaden() {
    const savedData = localStorage.getItem('finanzDaten');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        if(data.hoTage) document.getElementById('ho-tage').value = data.hoTage;
        if(data.stromKwh) document.getElementById('strom-kwh').value = data.stromKwh;
        if(data.stromPreis) document.getElementById('strom-preis').value = data.stromPreis;
        if(data.stromGrund) document.getElementById('strom-grund').value = data.stromGrund;
        if(data.steuerBrutto) document.getElementById('steuer-brutto').value = data.steuerBrutto;
        if(data.steuerKlasse) document.getElementById('steuer-klasse').value = data.steuerKlasse;
        if(data.kinderAnzahl) document.getElementById('kinder-anzahl').value = data.kinderAnzahl;
        
        // Trigger calculations
        if(data.hoTage) berechneHomeoffice();
        if(data.stromKwh) berechneStrom();
        if(data.steuerBrutto) berechneSteuer();
        
        const msg = document.getElementById('storage-msg');
        msg.textContent = "✅ Daten geladen.";
    } else {
        alert("Keine gespeicherten Daten gefunden.");
    }
}