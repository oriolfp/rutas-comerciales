# PRD: Vehicles en temps real al mapa (línia seleccionada)

## 1. Introduction / Overview

Quan l'usuari selecciona una línia al mode "Línies", el mapa actualment només mostra la ruta i les parades. Aquesta feature afegeix **els vehicles de la línia (busos o trens de metro) pintats en posicions extrapolades en temps real al llarg de la ruta**, refrescables sota demanda amb un cooldown visible de 2 minuts.

El problema que resol: l'usuari vol saber *on són els vehicles ara mateix* per decidir cap a quina parada té sentit anar (la més propera, una amb un vehicle a punt d'arribar, etc.).

**Goal**: visualitzar al mapa cada vehicle conegut amb la seva direcció i posició estimada amb una precisió suficient per a decisions ràpides (parada actual aprox. ±1 segment), sense saturar el cost de Functions.

## 2. Goals

1. Mostrar al mapa **tots els vehicles** que TMB ens reporta a través de les arribades als stops de la línia seleccionada.
2. Posició de cada vehicle calculada per **interpolació lineal sobre la polilínia de la ruta**, basada en els minuts d'arribada a la propera parada.
3. **Distinció visual immediata** entre bus i metro, amb la direcció del vehicle a primera vista.
4. **Refresc manual** amb cooldown de 2 minuts + comptador regressiu visible al botó.
5. **No incrementar significativament** el consum de Netlify credits (objectiu: ≤ 1 invocació de funció per refresc, batching al servidor).

## 3. User Stories

- **Com a passatger**, selecciono la línia H10 i veig immediatament tots els busos H10 pintats al mapa pintats del color de la línia, sabent cap a on van, perquè així puc anar cap a la parada més propera amb un bus arribant aviat.
- **Com a usuari curiós**, faig clic sobre un bus i veig les 3 properes parades pendents amb els minuts estimats, sense haver d'obrir-ne cada una.
- **Com a usuari que vol info fresca**, premo el botó de refresc i veig com s'actualitzen vehicles + temps al panell, i el botó es bloqueja durant 2 min mostrant un comptador.

## 4. Functional Requirements

### Activació

1. La feature s'activa **només** al mode "Línies" quan hi ha una línia seleccionada (bus o metro). No s'aplica al mode "Aprop meu".
2. En seleccionar una línia es dispara una càrrega inicial automàtica de vehicles, sense esperar interacció.

### Càrrega de dades

3. El servidor exposa un nou endpoint `GET /api/vehicles/{tipus}/{liniaCodi}` que retorna:
   ```json
   {
     "actualitzat": "2026-05-25T14:50:00Z",
     "vehicles": [
       {
         "id": "string",
         "destinacio": "string",
         "minutsFinsProperaParada": number,
         "properaParadaCodi": "string",
         "properaParadaNom": "string",
         "lat": number,
         "lng": number,
         "direccio": "right" | "left",
         "cuaProperesParades": [
           { "codi": string, "nom": string, "minuts": number }
         ]
       }
     ]
   }
   ```
4. Per a **metro**, internament fa **una sola crida** a `/v1/itransit/metro/estacions?estacions=<CSV de tots els codi_estacio de la línia>`.
5. Per a **bus**, internament fa fan-out a `/v1/ibus/stops/{codi_parada}` amb `mapLimit` (concurrència 10) per a totes les parades de la línia.
6. Aquesta resposta porta `Cache-Control: public, max-age=30` i `Netlify-CDN-Cache-Control: public, max-age=30, durable` per absorbir refrescs múltiples d'usuaris diferents.

### Càlcul de posició (extrapolació)

7. Per a cada arribada (per cada parada destí de la línia):
   - Es determina la **direcció** comparant la `destinacio` reportada amb els capçaleres de la línia.
   - Es localitza la **parada anterior** (en l'ordre de la direcció) a la propera parada (N) per saber el segment N-1→N.
   - Es projecta la posició al **fragment de polilínia** entre N-1 i N: si `tempsArribada` és X minuts i el segment es recorre típicament en Y minuts, el vehicle es pinta a la fracció `1 - clamp(X/Y, 0, 1)` del segment.
   - Y s'estima com `distància_segment / velocitat_mitjana` amb velocitat mitjana **bus = 5 m/s** (≈18 km/h), **metro = 8 m/s** (≈29 km/h).
   - Si X ≥ Y, el vehicle encara és abans del segment (entre N-2 i N-1): es desplaça el càlcul cap a un segment anterior fins que el temps caigui dins.
8. Vehicles a "Arribant" (X < 0.5 min) es pinten directament al punt de la parada destí.
9. La direcció (`right`/`left`) es deriva de la diferència x entre els dos extrems del segment on s'ha col·locat el vehicle, per orientar la icona del bus o el metro horitzontalment al mapa.

### UI: marcadors al mapa

10. Cada vehicle es pinta amb una icona SVG segons l'**estil escollit** (silueta sòlida del color de la línia, sense codi de línia incrustat):
    - **Bus**: variant C — bus rectangular simètric + chevron `>` separat del davant indicant direcció. Roda gris fosc.
    - **Metro**: silueta arrodonida amb nas (direccional integrat), llum frontal petita.
    - L'icona es flipa horitzontalment quan `direccio === 'left'`.
11. Els marcadors s'integren com a Leaflet `DivIcon` perquè es puguin escalar i flipar amb CSS.
12. Al passar el ratolí (o long-press a mòbil) sobre un vehicle, apareix un Tooltip amb el codi de la línia + destinació.
13. Al fer **clic** sobre un vehicle s'obre un Popup amb:
    - Codi de línia + destinació, en gran.
    - Llista de les **3-4 properes parades** previstes amb els minuts estimats fins a cadascuna.

### UI: botó de refresc + cooldown

14. Al mapa, dalt a la dreta (juntament amb els controls existents), un botó circular amb la icona ↻.
15. Estats del botó:
    - **Idle** (ja es pot refrescar): icona fosca, cliclable.
    - **Loading** (mentre fa la crida): icona girant.
    - **Cooldown** (durant 2 min després d'un refresc reeixit): icona deshabilitada amb un **comptador regressiu visible** dins del botó (ex. `1:53`).
16. El refresc dispara **dues** crides en paral·lel: vehicles + arribades del panell (perquè ambdues sincronitzin).
17. El cooldown és global a la sessió, no es reseteja en navegar entre línies.

### Comportament al canviar de línia o sortir del mode

18. Si l'usuari canvia de línia mentre hi ha vehicles pintats, es netegen els marcadors actuals i es dispara una nova càrrega.
19. Si l'usuari fa toggle a "Aprop meu", els vehicles desapareixen i el botó de refresc s'amaga.

### Performance i robustesa

20. Si l'endpoint torna `vehicles: []` (sense vehicles propers), el mapa mostra la ruta i les parades com sempre, sense missatge d'error.
21. Si la crida falla (5xx), es mostra un toast discret "No s'han pogut obtenir els vehicles" i el botó torna a estat Idle (no penalitzem amb cooldown si la crida ha fallat).
22. Tots els vehicles que TMB reporti es pinten (sense límit superior); si hi ha duplicats per orientació al mateix lat/lng se separen amb un petit offset.

## 5. Non-Goals (Out of Scope)

- No es mostraran vehicles en **mode "Aprop meu"** (massa soroll visual amb 5-10 línies a la vegada).
- No es polleja automàticament cada X segons. Tot refresc és manual.
- No es mostren vehicles fora de servei o de reserva (TMB no els reporta a les arribades).
- No es persisteix l'historial de vehicles. Cada fetch reescriu l'estat.
- No es fa un càlcul avançat amb GTFS-RT o trip updates. La velocitat mitjana és constant.
- No s'animen transicions de vehicles entre refrescs. Els marcadors fan "salt" net al nou lloc.
- No es donen indicacions d'incidència o de servei interromput.

## 6. Design Considerations

- **Icones**: estil "silueta sòlida pintada del color de la línia, sense codi", aprovat al mockup `mockup-vehicle-icons-v3.html` (Bus variant C + metro refinat). Mantenir-les com a SVG inline per servir-les via DivIcon de Leaflet.
- **Botó de refresc**: aprofitar la paleta groga `#f4a300` per al comptador (consistent amb els ranks de "Aprop meu"), fons blanc i ombra suau com els altres controls del mapa.
- **Popup del vehicle**: reutilitza el mateix estil que `StopPopup` per coherència visual, però amb la llista de "properes parades" amb minuts en vermell `#c8001e` a la dreta.
- **Tooltip ràpid**: estil compacte com els que ja tenim a `.stop-tooltip` / `.user-tooltip`.

## 7. Technical Considerations

- **Reaprofitar la polilínia ja carregada** per la línia seleccionada (`useGeometria`) per fer la interpolació al frontend sense fetches addicionals.
- **Càlcul d'interpolació al frontend**, no al backend: el backend serveix dades crues (arribades + parades), el frontend les projecta a la polilínia. Així el backend és més senzill i cachejable.
- **Fer el càlcul un sol cop per refresc**, en un `useMemo` que depèn de `{ vehiclesRaw, parades, geometria }`.
- L'endpoint `/api/vehicles/{tipus}/{liniaCodi}` pot reutilitzar `fetchIBus` i `fetchIMetro` existents amb modificacions menors (acceptar múltiples stops).
- Estimació de velocitat: constants en un fitxer compartit `src/utils/transit.ts` (`SPEED_M_S = { bus: 5, metro: 8 }`).
- Cap llibreria nova; ja tenim `leaflet`, `react-leaflet`, helpers de distància.

## 8. Success Metrics

- L'usuari pot veure ≥ 1 vehicle pintat al mapa per a una línia activa el 90% de les ocasions (en horari de servei).
- La direcció del vehicle (chevron / nas) coincideix amb la realitat ≥ 95% del temps (no es dispara cap warning de "no he pogut determinar la direcció").
- Cooldown de refresc respectat: el botó es bloqueja durant exactament 2 minuts (±1 s) després de cada refresc reeixit.
- Cost de credits: el nou endpoint **no supera el 10%** del consum total del mes (mesurat al panell de Netlify).
- Cap usuari reporta marcadors a posicions clarament absurdes (fora de la polilínia, en sentit contrari).

## 9. Open Questions

1. Per a la velocitat mitjana del bus, és correcte el valor de **18 km/h**? A Barcelona els busos urbans solen moure's entre 12-18 km/h depenent de trànsit. Si veiem que els vehicles "s'avancen" massa a la realitat, ajustem.
2. Què passa si una línia té múltiples capçaleres en una mateixa direcció (ex. la 7 té variants curtes/llargues)? La proposta inicial és tractar la `destinacio` reportada com a indicador definitiu de direcció; queda per validar.
3. Volem mostrar **el codi de servei** del vehicle al popup (ex. `12001`, número intern de la unitat) o és informació interna sense valor per a l'usuari? Per defecte: no.
4. Si l'usuari fa zoom out fins a veure tota la ciutat, hauríem d'agrupar vehicles propers en un cluster, o deixar-los individuals? Inicialment individuals; revisar si visualment és caòtic.
