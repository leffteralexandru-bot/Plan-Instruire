/**
 * Ghid măsurător pe tip — conținut din „Ghid pe teren — pe tip de măsurare”.
 * Structură fișă: A condiții · B obligații · D reguli tip · E pași · F checklist.
 * Reguli comune (C) și kitul (echipament + documente) sunt în operationalGuide.ts.
 */

export interface MeasurerTypeContent {
  introText: string;
  preMeasurementConditions: string[];
  fieldObligations: string[];
  typeFieldRules: string[];
  /** Pași detaliați pe teren (E) */
  steps: string[];
  /** Checklist final înainte de plecare (F) */
  finalChecklist: string[];
}

export const MEASURER_TYPE_CONTENT = {
  blat: {
    introText:
      'Fișă blat: fără condiții îndeplinite, măsurarea nu începe. Regula de bază: chiar dacă arată montat vizual — întrebi și verifici fizic. Șorțul (placare spate) se tratează la Placare perete, nu aici.',
    preMeasurementConditions: [
      'Prezența obligatorie a persoanei cu putere de decizie — fără ea nu se iau decizii pe muchie, îmbinări, ieșirea blatului peste front sau accesorii.',
      'Mobila montată complet, fixată și reglată pe orizontal — blatul se măsoară pe mobilă gata, nu pe corpuri „aproape gata”.',
      'Dacă există mașină de vase, este solicitabil să fie montată înainte de măsurare.',
      'Prezența obligatorie a accesoriilor pe loc: baterie, chiuvetă, aragaz/plită, dozator, filtru, buton mărunțitor etc. — fără ele nu poți verifica golurile reale.',
      'Acces liber pentru măsurare: fără obstacole care să blocheze Prolinerul, ruletă sau verificarea fronturilor.',
    ],
    fieldObligations: [
      'Mobila este completă sau mai așteptați ceva? — Verifici fizic: deschizi fronturile, mașina de vase, cuptorul, frigiderul și confirmi cu clientul. Evită: măsurare pe mobilă incompletă.',
      'Se mai montează ceva după măsurarea noastră? — Corpuri pe blat, suspendate, schimb de fronturi/laterale; notezi pe Anexa 1. Evită: cote mutate după montaj ulterior.',
      'Mașina de vase este montată, legată la apă, cu frontul reglat și prinsă pe laterale? — Fără ea, linia frontului și adâncimea se schimbă. Evită: blat scurt/lung sau nealiniat.',
      'În ce gol se montează chiuveta? — Scoți chiuveta și bateria din cutie, le așezi în gol, verifici față de geam și placarea de spate; notezi în carnet.',
      'Există găuri suplimentare (dispenser, apă filtrată, mărunțitor)? — Dacă da: unde, pe ce corp; notezi și fotografiezi cu cote pe imagine.',
      'Plita se centrează pe hotă sau pe corpul de jos? — Verifici dacă plita încape peste cuptor. Variante: cobori cuptorul + fatadă falsă, sau îngroșare pe blat (la glaf integral nu blochează geamul).',
      'Gola este la nivel cu corpul (sau puțin mai jos) și acceptați ieșirea blatului peste front de minim 2 mm? — Gola mai sus împinge fronturile; regula: blat iese în FAȚĂ min. 2 mm. Notezi pe Anexa 1.',
      'Se schimbă laterale sau fronturi (zgârieturi, nuanță)? — Dacă da: amâni măsurarea sau notezi riscul pe Anexa 1.',
      'Reverificare pe loc înainte să pleci: Anexa 1 semnată, poze cu cote, video, Proliner, fișe accesorii — completezi pe loc, nu „acasă”.',
    ],
    typeFieldRules: [
      'Spațiul de dilatare se prevede pe loc, după tipul materialului din fișa tehnică — nu se lasă „de văzut la proiectare”.',
      'Ieșirea blatului peste front (minim 2 mm) și razele de colț se clarifică cu clientul pe loc, se notează pe schiță / Anexa 1 și se confirmă verbal + scris.',
      'Fiecare gol (chiuvetă, plită, accesorii) se măsoară individual — nu se copiază un gol pe altul „din serie”.',
      'Proliner pe blat: conturul blatului pe mobilă + toate întoarcerile + toate decupajele + golurile corpurilor; puncte surplus la fiecare îmbinare.',
      'Măsoară tot ce e posibil pe contur — chiar dacă un colț sau o întoarcere pare „nefolositoare”; proiectarea are nevoie de tot.',
      'Verifici alinierea: linie fronturi jos față de toc / laterale. Diferență >3–4 mm = mobilă nealiniată — oprești și anunți.',
      'Glaf integral: baza glafului trebuie ≤ nivelul mobilei (−2 mm dacă glaful e mai sus). Atenție: corp cafea 18 mm vs. blat 20 mm → conflict +2 mm.',
      'Rezistențele / suportul mobilierului: verifici după fișa materialului — ieșire mare peste front fără suport = risc de rupere.',
    ],
    steps: [
      'Înainte de Proliner: citești Anexa 1 (muchie, finisaj, accesorii) și fișele tehnice din task — știi ce măsori, nu „descoperi” pe parcurs.',
      'Verificarea mobilei: deschizi TOATE fronturile de jos. Aliniate? Se închid corect? MV / cuptor / frigider — fără lovituri? Dacă e strâmb, notezi și anunți.',
      'Întrebări către client (chiar dacă „pare gata”): mobilă completă? schimb laterale/fronturi? corpuri pe blat după montaj? Răspunsurile pe Anexa 1.',
      'Mașina de vase: montată, legată la apă, front reglat, prinsă pe laterale — fără asta măsurarea e invalidă.',
      'Punct de referință: alegi UN colț / punct de start pe mobilă, îl marchezi pe schiță și pe teren. Toate cotele se raportează la el.',
      'Adâncimi corpuri: măsori FIECARE corp (stânga–dreapta pot diferi). Notezi pe carnet. Foto generală a liniei de mobilă.',
      'Contur Proliner pe blat: pe deasupra mobilei, inclusiv întoarceri (L, U, peninsula). La fiecare îmbinare — puncte surplus.',
      'Diagonale și unghiuri: la fiecare îmbinare; unghiurile NU se presupune 90°. Dacă sunt >2 îmbinări, faci șablon.',
      'Chiuvetă: confirmi golul, așezi chiuveta în gol, verifici față de geam și spate. Găuri extra (dispenser / filtru / mărunțitor) — da/nu, unde. Cote pe poză + carnet.',
      'Plită: centrare pe hotă sau corp? Încape peste cuptor? Variante pe loc pe Anexa 1 (coborâre cuptor / îngroșare; glaf integral nu blochează geamul).',
      'Gola: la nivel cu corpul sau puțin mai jos (max. ≈ −1 mm). Dacă e mai sus — notezi și anunți înainte de a încheia.',
      'Ieșire peste front (în FAȚĂ, nu în sus): minim 2 mm. Chiar dacă clientul cere „la față”, explici și notezi pe Anexa 1.',
      'Dilatare + raze colț + FAȚĂ VĂZUTĂ: notezi spațiul după material; marchezi FAȚA VĂZUTĂ pe schiță + foto.',
      'Control ruletă vs. Proliner pe 2–3 cote critice. Citire cu voce tare la cotele critice (anti 1180→1810).',
      'Poze de predare: fiecare decupaj/accesoriu cu cote SCRISE pe imagine; foto MV; ansamblu; FAȚĂ VĂZUTĂ. Fără cote pe poză = predare incompletă.',
      'Semnătură + reverificare pe loc: Anexa 1 semnată; set complet (poze, video, Proliner, fișe). Predarea formală după proiectare — pe teren nu pleci cu date incomplete.',
    ],
    finalChecklist: [
      'Condiții client — bifațe / semnate (mobilă, mașină de vase, accesorii, acces).',
      'Mobilă + mașină de vase + fronturi verificate fizic; nimic „după măsurare”.',
      'Chiuvetă / plită / golă / ieșire peste front min. 2 mm / dilatare / FAȚĂ VĂZUTĂ — clarificate pe Anexa 1.',
      'Proliner complet pe blat (fără șorț în acest tip — șorțul = placare).',
      'Reverificat pe loc: Anexa 1 semnată + poze cu cote + video + Proliner (+ fișe) — tot înregistrat.',
    ],
  },

  scara: {
    introText:
      'Fișă scări interior: fără condiții îndeplinite, măsurarea nu începe. Fiecare treaptă se măsoară individual.',
    preMeasurementConditions: [
      'Prezența obligatorie a persoanei cu putere de decizie.',
      'Acces pentru măsurare — fără obstacole care restricționează accesul spre obiect.',
      'Să nu se execute lucrări care produc praf în nemijlocita apropiere de obiectul măsurat.',
      'Dacă scările sunt cu LED — să existe mostră de profilul în care va fi instalat LED-ul.',
      'Pe suprafața scărilor care urmează a fi măsurate să nu fie montată schelă.',
      'Să fie stabilit tipul treptelor (ex. secțiune).',
    ],
    fieldObligations: [
      'Confirmi tipul treptelor / secțiunea pe Anexa 1 înainte de Proliner.',
      'Măsori înălțimea fiecărei trepte — nu copiezi o treaptă pe toată scara.',
      'Întrebi LED: în treaptă sau contratreaptă; ai mostră de profil dacă e cazul.',
      'Întrebi plintă (înălțime tipică 50–70 mm) și notezi pe Anexa 1.',
      'Predai setul: Anexa 1 + poze + video + Proliner (complet, fără date lipsă pe teren).',
    ],
    typeFieldRules: [
      'Prima treaptă (jos) poate fi mai sus; ultima (sus) egală sau mai mică. Diferențe mari → ajustezi pe palier, NU degrosezi betonul.',
      'Ieșire peste contratreaptă: piatră naturală max. ~20 mm; cu LED → cant ~40 mm.',
      'Material 4/6/8 mm: fără ieșire peste front; bază ±3 mm. Canal LED ≤ 1/3 grosime.',
      'Proliner: trepte + paliere + vangă/întoarceri; puncte surplus pe fiecare treaptă + schimbări de direcție.',
      'Fiecare gol / treaptă se măsoară individual — nu din serie.',
    ],
    steps: [
      'Anexa 1: tip trepte/secțiune; LED dacă e cazul; semnătură client.',
      'Îmbinări trepte/paliere pe canting; dezacord → Anexa: surplus + anunț manager / client.',
      'Proliner: trepte + paliere + vangă/întoarceri; puncte surplus pe fiecare treaptă + schimbări direcție.',
      'Poze + carnet + control ruletă pe cote critice (înălțimi trepte, lățimi).',
      'Reverificare pe loc: Anexa 1 + poze + video + Proliner — set complet înainte de plecare.',
    ],
    finalChecklist: [
      'Condiții client — bifațe / semnate (fără schelă pe trepte, fără praf).',
      'Tip trepte + LED clarificate.',
      'Fiecare treaptă măsurată; Proliner complet.',
      'Anexa 1 semnată; setul de predare înregistrat pe loc.',
    ],
  },

  placare: {
    introText:
      'Fișă placare perete. Șorțul (placarea pe perete / spate la bucătărie) urmează ACELEAȘI reguli — nu se tratează în capitolul Blat.',
    preMeasurementConditions: [
      'Prezența obligatorie a persoanei cu putere de decizie.',
      'Acces pentru măsurare — fără obstacole care restricționează accesul spre obiect.',
      'Pereții să fie pregătiți pentru placare (se interzice placare pe bază de gips).',
      'Să fie montate toate prizele și conexiunile (apă, canalizare).',
      'Suportul TV montat în perete (dacă e cazul).',
      'Prezența grilei de ventilare (dacă e cazul).',
    ],
    fieldObligations: [
      'Verifici planeitatea / verticalitatea cu laser — nu doar pe ochi.',
      'Fotografiază prizele, întrerupătoarele și golurile tehnice perete cu perete și le numeri.',
      'Întrebi prize: păstrați / anulați / adăugați / măriți? Aliniere OK?',
      'Găuri prindere hotă/poliță: înainte de măsurare. Decupaje doar în fabrică (Waterjet) — interzis pe loc.',
      'Clarifici LED sub mobilă, hotă (buză vs. mobilă), pardoseală→tavan / parchet.',
      'Predai setul: Anexa 1 + poze + video + Proliner.',
    ],
    typeFieldRules: [
      'Linie orizontală laser + verticală Proliner = reper; trasezi pe perete cu creionul, apoi conturul.',
      'Laser vertical: adeziv min 3–4 mm / max ~15 mm; creion = linia din față a placării.',
      'Îmbinări: canting + Comanda de transfer (dimensiuni placă) + lift/scări/persoane.',
      'Proliner: contur + întoarceri + goluri (prize, ventilare, TV); planeitate/verticalitate.',
      'Măsoară tot ce e posibil — inclusiv contururi care par „nefolositoare”.',
    ],
    steps: [
      'Anexa 1 + observații placare; rosturi/îmbinări pe canting.',
      'Proliner: contur + întoarceri + goluri; planeitate/verticalitate cu laser.',
      'Poze perete cu perete (toate golurile numerotate).',
      'Control ruletă pe cote critice; note carnet.',
      'Reverificare pe loc: Anexa 1 + poze + video + Proliner — set complet.',
    ],
    finalChecklist: [
      'Condiții client — pereți pregătiți, prize, TV, grilă (unde e cazul).',
      'Laser + Proliner; toate golurile foto + numărate.',
      'Anexa 1 semnată; setul de predare înregistrat pe loc.',
    ],
  },

  semineu: {
    introText:
      'Fișă placare cămin: fără condiții îndeplinite, măsurarea nu începe. Compari măsurătoarea cu proiectul pe loc.',
    preMeasurementConditions: [
      'Prezența obligatorie a persoanei cu putere de decizie.',
      'Acces pentru măsurare — fără obstacole care restricționează accesul spre obiect.',
      'Căminul trebuie să fie construit.',
      'Termoizolarea trebuie să fie executată.',
      'Grila de ventilare prezentă.',
      'Trebuie să avem schiță conceptuală / proiectul căminului.',
    ],
    fieldObligations: [
      'Ai la tine schița / proiectul căminului și compari măsurătoarea cu proiectul pe loc.',
      'Verifici termoizolarea și grila înainte de Proliner.',
      'Predai setul: Anexa 1 + poze + video + Proliner (+ schiță/proiect).',
    ],
    typeFieldRules: [
      'Proliner: contur cămin + întoarceri + grile + zone termoizolare; compară cu proiectul.',
      'Planeitate / verticalitate verificate cu releveu laser.',
      'Îmbinări pe canting; dezacord → Anexa: surplus + anunț.',
    ],
    steps: [
      'Anexa 1 cu proiect/schiță conceptuală; îmbinări pe canting.',
      'Proliner: contur cămin + întoarceri + grile + termoizolare; compară cu proiect.',
      'Poze cămin/grilă; note carnet.',
      'Reverificare pe loc: Anexa 1 + poze + video + Proliner (+ schiță) — set complet.',
    ],
    finalChecklist: [
      'Cămin construit + termoizolare + grilă + proiect.',
      'Proliner vs. proiect verificat pe loc.',
      'Anexa 1 semnată; setul de predare înregistrat pe loc.',
    ],
  },

  scara_exterior: {
    introText:
      'Fișă scări exterioare: fără condiții / schele / meteo OK, măsurarea nu începe.',
    preMeasurementConditions: [
      'Prezența obligatorie a persoanei cu putere de decizie.',
      'Acces pentru măsurare — fără obstacole care restricționează accesul spre obiect.',
      'Prezență schele în cazul măsurărilor la înălțime.',
      'În caz că este placare existentă — demontată până la măsurare pentru acces la bază.',
      'În caz de ploaie sau ninsoare, măsurarea se reprogramează.',
    ],
    fieldObligations: [
      'Nu măsori fără schele sigure la înălțime.',
      'La ploaie / ninsoare: oprești și reprogramezi — nu forțezi măsurarea.',
      'Dacă există placare veche: verifică că e demontată până la bază.',
      'Predai kit complet: Anexa 1 + poze + video + Proliner.',
    ],
    typeFieldRules: [
      'Proliner: trepte + întoarceri + bază — doar cu schele sigure.',
      'Exterior: picurător ≥7 mm de margine, adâncime ≤1/3; pantă 2–3 mm, fără contrapantă.',
      'Fiecare treaptă se măsoară individual; puncte surplus pe trepte și la schimbări de direcție.',
      'Măsori înălțimea fiecărei trepte; diferențe mari → ajustezi pe palier, nu degrosezi baza.',
    ],
    steps: [
      'Anexa 1: schele, bază, meteo; îmbinări pe canting.',
      'Proliner: trepte + întoarceri + bază — doar cu schele sigure; ploaie/ninsoare → reprogramare.',
      'Poze + carnet + control ruletă.',
      'Reverificare pe loc: kit complet Anexa 1 + poze + video + Proliner.',
    ],
    finalChecklist: [
      'Schele + meteo OK; bază accesibilă.',
      'Proliner + poze complete.',
      'Anexa 1 semnată; setul de predare înregistrat pe loc.',
    ],
  },

  glaf: {
    introText:
      'Fișă pervazuri / glafuri interior / exterior: fiecare gol se măsoară individual, cu cod F1…Fn.',
    preMeasurementConditions: [
      'Prezența obligatorie a persoanei cu putere de decizie.',
      'Acces pentru măsurare — fără obstacole care restricționează accesul spre obiect.',
      'Schele pentru pervazuri la înălțime.',
      'Recomandat: baza pregătită 30 mm sub tocul ferestrei.',
      'Să fie executat stratul final de tencuială sau termoizolare.',
      'La exterior: elemente decorative de subpervaz și/sau împrejurul acestuia prezente.',
    ],
    fieldObligations: [
      'Măsori fiecare gol individual — nu din serie.',
      'Coduri F1…Fn pe schiță și pe toc, fotografiate.',
      'La exterior înregistrezi panta: interior, exterior, diferență.',
      'Schele la înălțime — obligatoriu.',
      'Predai: Anexa 1 + poze pe fiecare gol cu cod F + Proliner.',
    ],
    typeFieldRules: [
      'Exterior: pantă 2–3 mm (lățime ~100–300 mm) + picurător; recomandat SUB rama geamului.',
      'Interior: fără pantă, fără picurător; în ramă sau sub ramă.',
      'Proliner: fiecare gol F1…Fn pe toc + întoarceri; exterior = pantă.',
      'Codurile de poziție (F1, F2… Fn) se scriu pe schiță și pe toc și se fotografiază.',
    ],
    steps: [
      'Anexa 1: interior/exterior, pantă; îmbinări pe canting.',
      'Proliner: fiecare gol F1…Fn pe toc + întoarceri; exterior = pantă.',
      'Poze pe fiecare gol cu cod F; note carnet.',
      'Reverificare pe loc: Anexa 1 + poze + video + Proliner — set complet.',
    ],
    finalChecklist: [
      'Bază / tencuială / elemente decorative OK.',
      'Fiecare gol cu cod F + pantă (exterior).',
      'Anexa 1 semnată; setul de predare înregistrat pe loc.',
    ],
  },

  placare_exterior: {
    introText:
      'Fișă placări exterioare / parapet (atic): schele, meteo, bază și prindere mecanică — obligatorii.',
    preMeasurementConditions: [
      'Prezența obligatorie a persoanei cu putere de decizie.',
      'Acces pentru măsurare — fără obstacole care restricționează accesul spre obiect.',
      'Prezență schele în cazul măsurărilor la înălțime.',
      'În caz de ploaie sau ninsoare, măsurarea se reprogramează.',
      'În caz că este placare existentă — demontată până la măsurare pentru acces la bază.',
      'Aceste tipuri de lucrări necesită prindere mecanică.',
    ],
    fieldObligations: [
      'Nu măsori fără schele sigure; la ploaie/ninsoare reprogramezi.',
      'Confirmi prinderea mecanică pe Anexa 1 și pe schiță.',
      'Verifici baza (placare veche demontată).',
      'Predai kit complet: Anexa 1 + poze + video + Proliner.',
    ],
    typeFieldRules: [
      'Proliner: contur + întoarceri + zone prindere mecanică; schele; meteo → reprogramare.',
      'Planeitate / verticalitate cu releveu laser.',
      'Rosturi / îmbinări pe canting + Comanda de transfer (dimensiuni placă).',
      'Livrare: etaj, lift/scări, nr. persoane — notezi dacă știi.',
    ],
    steps: [
      'Anexa 1: prindere mecanică, schele; rosturi pe canting.',
      'Proliner: contur + întoarceri + zone prindere; schele; meteo → reprogramare.',
      'Poze + carnet + control ruletă.',
      'Reverificare pe loc: kit complet Anexa 1 + poze + video + Proliner.',
    ],
    finalChecklist: [
      'Schele + meteo + bază + prindere mecanică.',
      'Proliner + poze complete.',
      'Anexa 1 semnată; setul de predare înregistrat pe loc.',
    ],
  },
} as const satisfies Record<string, MeasurerTypeContent>;
