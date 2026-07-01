import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '..', 'public', 'docs');
fs.mkdirSync(docsDir, { recursive: true });

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — artGRANIT</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1.5rem; color: #1e293b; line-height: 1.6; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #10b981; padding-bottom: 0.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.5rem; color: #334155; }
    ul, ol { padding-left: 1.25rem; }
    .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .note { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 8px; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <p class="meta">artGRANIT — Material suport instruire</p>
  <h1>${title}</h1>
  ${body}
  <p class="meta" style="margin-top:2rem">© artGRANIT — document intern instruire</p>
</body>
</html>`;
}

const docs = {
  'portofoliu-artgranit.html': page('Portofoliu artGRANIT', `
    <p>Prezentare proiecte reprezentative: bucătării premium, băi, blaturi comerciale, insule centrale.</p>
    <h2>Tipuri de proiecte</h2>
    <ul>
      <li>Blaturi L și U — granit natural, quartz</li>
      <li>Insule centrale cu canturi profilate</li>
      <li>Backsplash și panouri perete</li>
      <li>Proiecte comerciale — recepții, baruri</li>
    </ul>
    <p class="note">Înlocuiți acest document cu portofoliul PDF oficial al companiei.</p>
  `),
  'video-istoric.html': page('Video Istoric Companie', `
    <p>Material video: prezentarea istoricului și valorilor artGRANIT.</p>
    <p class="note">Încărcați aici link-ul către video-ul oficial sau fișierul MP4 pe serverul intern.</p>
  `),
  'catalog-materiale.html': page('Catalog Materiale', `
    <h2>Granit natural</h2>
    <table>
      <tr><th>Material</th><th>Grosime</th><th>Utilizare</th></tr>
      <tr><td>Granit polisht</td><td>2 cm / 3 cm</td><td>Interior, bucătării</td></tr>
      <tr><td>Granit flamed</td><td>3 cm</td><td>Exterior, terase</td></tr>
    </table>
    <h2>Quartz</h2>
    <p>Rezistență ridicată la pete; evitați expunerea prelungită UV în exterior.</p>
    <h2>Ceramică</h2>
    <p>Opțiune economică pentru backsplash și suprafețe verticale.</p>
  `),
  'manual-proliner.html': page('Manual Proliner', `
    <h2>Capitol 1 — Introducere</h2>
    <p>Proliner este sistemul de măsurare digitală folosit pentru captarea conturului blaturilor.</p>
    <h2>Capitol 2 — Pregătire echipament</h2>
    <ol>
      <li>Verificare baterie și calibrare</li>
      <li>Selecție sondă potrivită</li>
      <li>Test conexiune software</li>
    </ol>
    <h2>Capitol 3 — Măsurare</h2>
    <p>Parcurgeți conturul în sens orar, marcați punctele de referință și obstacolele.</p>
    <h2>Capitol 4 — Export</h2>
    <p>Exportați fișierul în formatul acceptat de software-ul CAD artGRANIT.</p>
  `),
  'tutorial-proliner.html': page('Tutorial Video Proliner', `
    <p>Demonstrație video: măsurare blat simplu L, export fișier, verificare în CAD.</p>
    <p class="note">Încărcați tutorialul video oficial Proliner aici.</p>
  `),
  'sablon-cad.html': page('Șablon Proiect CAD', `
    <p>Șablon standard pentru desenare blat: straturi, cotări, legendă materiale, detalii cant.</p>
    <p class="note">Înlocuiți cu fișierul DWG/DXF oficial din biblioteca artGRANIT.</p>
  `),
  'modele-bitrix.html': page('Modele Documente Bitrix', `
    <h2>Documente standard per proiect</h2>
    <ul>
      <li>Fișă măsurători — template upload</li>
      <li>Fișă tehnică proiect — PDF generat CAD</li>
      <li>Raport vizită șantier</li>
      <li>Confirmare client — aprobare proiect</li>
    </ul>
  `),
  'ghid-bitrix.html': page('Ghid Rapid Bitrix24', `
    <h2>Navigare modul proiecte</h2>
    <ol>
      <li>Deschideți proiectul din pipeline</li>
      <li>Creați task pentru faza curentă (măsurători / proiectare)</li>
      <li>Atașați documente în folderul proiectului</li>
      <li>Actualizați statusul la finalizare</li>
    </ol>
  `),
  'checklist-vizita.html': page('Checklist Vizită Măsurători', `
    <h2>Înainte de plecare</h2>
    <ul>
      <li>Proliner încărcat și calibrat</li>
      <li>Ruletă, nivelă, markere</li>
      <li>Contact client confirmat</li>
      <li>Plan acces șantier verificat</li>
    </ul>
    <h2>Pe șantier</h2>
    <ul>
      <li>Fotografii spațiu general</li>
      <li>Notare obstacole (prize, țevi, ferestre)</li>
      <li>Verificare acces montaj (uși, scări)</li>
      <li>Confirmare material cu clientul</li>
    </ul>
  `),
  'cazuri-atipice.html': page('Cazuri Unghiuri Atipice', `
    <h2>Caz 1 — Colț între două pereți neperpendiculare</h2>
    <p>Măsurare suplimentară la intersecție; documentare unghi real în fișa tehnică.</p>
    <h2>Caz 2 — Stâlp în mijlocul blatului</h2>
    <p>Decupaj precis cu toleranță 2-3 mm; verificare la montaj.</p>
    <h2>Caz 3 — Blat cu rază concavă</h2>
    <p>Puncte suplimentare pe Proliner; validare cu mentor înainte de comandă.</p>
  `),
  'test-teoretic.html': page('Fișă Test Teoretic — Referință', `
    <p>Testul interactiv se completează direct în aplicație (Ziua 10).</p>
    <p>Acest document este ghid de studiu pentru capitolele: materiale, Proliner, CAD, Bitrix, oglindă.</p>
    <p class="note">Promovare: minimum 80% din întrebări corecte, maximum 3 încercări.</p>
  `),
  'procedura-oglinda.html': page('Procedură Măsurare Oglindă', `
    <h2>Principiu</h2>
    <p>Măsurarea simetrică folosind axa de oglindă ca referință pentru blaturi cu configurație oglindită.</p>
    <h2>Pași</h2>
    <ol>
      <li>Identificați axa de simetrie</li>
      <li>Măsurați o jumătate complet</li>
      <li>Verificați simetria cu ruleta pe cealaltă parte</li>
      <li>Documentați toleranțele acceptate (±2 mm)</li>
      <li>Validare mentor înainte de proiectare finală</li>
    </ol>
  `),
  'model-act-constatare.html': page('Model Act de Constatare', `
    <h2>Câmpuri obligatorii</h2>
    <ul>
      <li>Nume proiect / client</li>
      <li>Data măsurătorii</li>
      <li>Erori identificate</li>
      <li>Abateri măsurători (oglindă)</li>
      <li>Măsuri corective propuse</li>
    </ul>
    <p>Completați formularul digital din secțiunea <strong>Evaluări & Rapoarte</strong> din aplicație.</p>
  `),
};

for (const [filename, content] of Object.entries(docs)) {
  const filepath = path.join(docsDir, filename);
  fs.writeFileSync(filepath, content);
  console.log(`Created docs/${filename}`);
}
