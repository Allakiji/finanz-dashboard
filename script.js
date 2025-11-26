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

// 3. Steuer Schätzer (SEHR VEREINFACHT)
function berechneSteuer() {
    const brutto = parseFloat(document.getElementById('steuer-brutto').value);
    const output = document.getElementById('steuer-result');

    if (!brutto) return;

    // Vereinfachte progressive Annäherung (KEIN exaktes deutsches Steuerrecht!)
    // Grundfreibetrag ca 11.000 (Stand 2024 grob)
    let steuer = 0;
    const freibetrag = 11604; 

    if (brutto > freibetrag) {
        // Sehr grobe Formel für Durchschnittssteuersatz-Simulation
        const zuVersteuerndes = brutto - freibetrag;
        // Annahme: Progressiver Anstieg, durchschnittlich ca. 20-30% auf den Rest
        // Dies ist nur für die Demo! Echte Steuerformeln sind komplexer.
        if (brutto < 60000) {
             steuer = zuVersteuerndes * 0.25; 
        } else {
             steuer = zuVersteuerndes * 0.35; // Höherer Satz für höhere Einkommen
        }
    }

    const netto = brutto - steuer;

    output.innerHTML = `
        Geschätzte Lohnsteuer: <strong>ca. ${steuer.toFixed(2)} €</strong><br>
        Netto (vor Sozialabgaben): <strong>ca. ${netto.toFixed(2)} €</strong><br>
        <small>Hinweis: Dies ist eine grobe Schätzung ohne Sozialversicherung/Kiche.</small>
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