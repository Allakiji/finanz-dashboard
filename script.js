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
function berechneSteuer() {
    const brutto = parseFloat(document.getElementById('steuer-brutto').value);
    const klasse = parseInt(document.getElementById('steuer-klasse').value);
    const kircheSatz = parseInt(document.getElementById('steuer-kirche').value);
    const output = document.getElementById('steuer-result');

    if (!brutto || brutto < 0) {
        output.style.display = 'none';
        return;
    }

    // --- 1. Zu versteuerndes Einkommen (zvE) ermitteln ---
    const werbungskosten = 1230; 
    // Sozialabgaben Pauschale (Vorsorgeaufwendungen)
    const vorsorgePauschale = brutto * 0.21; 
    
    let zvE = brutto - werbungskosten - vorsorgePauschale;

    // Besonderheit Klasse 2 (Alleinerziehendenentlastungsbetrag)
    if (klasse === 2) {
        zvE -= 4260; 
    }

    if (zvE < 0) zvE = 0;

    // --- 2. Lohnsteuer berechnen ---
    let steuer = 0;

    if (klasse === 3) {
        // Splittingtarif: Wir tun so, als würde man das halbe Einkommen versteuern 
        // und nehmen das Ergebnis mal 2. (Stark vereinfacht für Steuerklasse 3)
        steuer = getEStG(zvE / 2) * 2;
    } else {
        // Grundtarif (Klasse 1, 2, 4)
        // Hinweis: Klasse 5 & 6 sind hier vereinfacht wie Klasse 1 behandelt, 
        // führen in der Realität aber zu höheren Abzügen.
        steuer = getEStG(zvE);
    }

    // Abrunden
    steuer = Math.floor(steuer);

    // --- 3. Zusatzabgaben ---
    
    // Soli (Grenze hängt eigentlich von Klasse ab, hier vereinfacht)
    let soli = 0;
    const freigrenzeSoli = (klasse === 3) ? 36260 : 18130; // Doppelte Grenze bei Splitting
    
    if (steuer > freigrenzeSoli) {
        soli = steuer * 0.055;
    }

    // Kirchensteuer (wird auf die Lohnsteuer berechnet)
    let kirchensteuer = 0;
    if (kircheSatz > 0) {
        kirchensteuer = steuer * (kircheSatz / 100);
    }

    // Sozialabgaben (echter Geldabzug vom Brutto)
    const sozialabgaben = brutto * 0.205; 

    // --- 4. Ergebnis ---
    const netto = brutto - steuer - soli - kirchensteuer - sozialabgaben;

    output.innerHTML = `
        <table style="width:100%; text-align:left; border-collapse: collapse;">
            <tr>
                <td>Brutto:</td>
                <td style="text-align:right"><strong>${brutto.toLocaleString('de-DE')} €</strong></td>
            </tr>
            <tr style="color:#777; font-size:0.9em;">
                <td>- Sozialabgaben:</td>
                <td style="text-align:right">${sozialabgaben.toLocaleString('de-DE', {maximumFractionDigits:0})} €</td>
            </tr>
            <tr style="color:#e74c3c;">
                <td>- Lohnsteuer (Kl. ${klasse}):</td>
                <td style="text-align:right">${steuer.toLocaleString('de-DE')} €</td>
            </tr>
            ${kirchensteuer > 0 ? `<tr style="color:#e74c3c;"><td>- Kirche (${kircheSatz}%):</td><td style="text-align:right">${kirchensteuer.toFixed(2)} €</td></tr>` : ''}
            ${soli > 0 ? `<tr style="color:#e74c3c;"><td>- Soli:</td><td style="text-align:right">${soli.toFixed(2)} €</td></tr>` : ''}
            <tr style="border-top: 2px solid #333; font-weight:bold; font-size: 1.1em;">
                <td>Netto (ca.):</td>
                <td style="text-align:right; color:#27ae60;">${netto.toLocaleString('de-DE', {maximumFractionDigits:2})} €</td>
            </tr>
        </table>
    `;
    output.style.display = 'block';
}

// 4. Profil Speichern (Local Storage)
function datenSpeichern() {
    const data = {
        hoTage: document.getElementById('ho-tage').value,
        stromKwh: document.getElementById('strom-kwh').value,
        stromPreis: document.getElementById('strom-preis').value,
        stromGrund: document.getElementById('strom-grund').value,
        steuerBrutto: document.getElementById('steuer-brutto').value
    };

    localStorage.setItem('finanzDaten', JSON.stringify(data));
    
    const msg = document.getElementById('storage-msg');
    msg.textContent = "✅ Daten erfolgreich im Browser gespeichert!";
    setTimeout(() => msg.textContent = "", 3000);
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