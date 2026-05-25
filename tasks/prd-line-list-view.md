# PRD: Vista llista per a una línia seleccionada (toggle Mapa | Llista)

## 1. Introduction / Overview

Quan l'usuari té una línia seleccionada al mode "Línies", actualment només pot veure-la sobre el mapa. Aquesta feature afegeix una vista alternativa de **llista** que mostra totes les parades de la línia ordenades per sentit, amb les seves correspondències i amb els vehicles posicionats al costat de la parada propera a la que aproparan. Es commuta entre **mapa** i **llista** amb un toggle dins de l'àrea del mapa.

El problema que resol: la vista de mapa és visualment intuïtiva però difícil per llegir noms de parades, especialment en mòbil; la llista és perfecta per planificar (saber l'ordre de parades, on hi ha transbordament i on són ara mateix els vehicles) sense haver de fer zoom.

**Goal**: oferir una segona perspectiva de la mateixa informació (parades + vehicles en temps real) optimitzada per la lectura seqüencial, sense afegir noves crides a l'API (aprofitem els hooks existents `useParades`, `useVehicles` i `useTempsReal`).

## 2. Goals

1. Toggle **Mapa | Llista** dins de l'àrea del mapa, persistent mentre canviï de línia.
2. Vista **Llista** que mostra **dues columnes** (una per sentit) amb totes les parades ordenades per `ordre`.
3. Cada parada inclou **mini-badges** de les altres línies que també hi paren (color + codi).
4. **Vehicles** pintats al costat de la propera parada que aproparan, amb el temps que falta (`↓ 3 min`).
5. **Clic en una parada** desplega un acordió amb el temps real de **TOTES les línies** que paren allà (com a "Aprop meu").
6. **Botó de refresc** segueix funcionant igual (compartit amb la vista de mapa).
7. Cap nou endpoint backend: tot reutilitza dades que ja tenim.

## 3. User Stories

- **Com a passatger**, prefereixo veure la llista de parades de la H10 per saber quina venir primer i quines tenen transbordament a metro, sense haver de fer zoom al mapa.
- **Com a usuari que espera el bus**, vull veure on és el bus que m'està a punt d'arribar dins la llista, per fer-me'n una idea visual ("encara és lluny" / "està a la parada anterior").
- **Com a viatger ocasional**, clic a una parada qualsevol de la llista i veig tots els temps d'arribada (no només la línia actual) per decidir si val la pena agafar un altre bus.

## 4. Functional Requirements

### Toggle de vistes

1. Apareix un control flotant a **dalt a l'esquerra del mapa** (alineat amb els controls de zoom de Leaflet), amb dues opcions: **Mapa** (icona de targeta) i **Llista** (icona de tres línies).
2. El control només és visible quan hi ha una línia seleccionada.
3. L'estat del toggle es manté entre canvis de línia (si l'usuari fa servir "Llista" amb la H10, en seleccionar H6 segueix en "Llista").
4. El toggle no es manté entre toggles globals "Línies / Aprop meu" — en sortir del mode "Línies", la vista es perd; en tornar-hi, comença a "Mapa" per defecte. (Memòria simple amb `useState` al `LiniesView`).

### Vista Llista

5. Substitueix el contingut del mapa per una **vista de dues columnes** quan està activa. Conserva el botó de refresc del mapa a dalt a la dreta.
6. Cada columna correspon a un **sentit** de la línia. La capçalera de la columna mostra el nom del destí del sentit (ex. "→ Fondo" / "→ Hospital de Bellvitge").
7. Si la línia és metro (que no té sentits explícits a `parada.sentit`), es deriven dues columnes a partir dels destins detectats als vehicles (`destinacio` distintes) o, si no n'hi ha de cap, es mostra una sola columna amb totes les estacions.
8. Cada **fila de parada** mostra:
   - Número d'ordre (gris petit)
   - Nom de la parada (negre, font normal)
   - Mini-badges de correspondències: codi + color de cada línia distinta que també para allà, fins a 4. Si n'hi ha més, badge addicional "+N".
9. La fila és **cliclable**. En clicar, s'expandeix un panell-acordió a sota amb una llista d'arribades de **totes** les línies que paren allà:
   - Una crida única per stop a `/api/temps-real/{tipus}/{liniaCodi}/{paradaCodi}?all=1` (l'endpoint ja existeix).
   - Es mostra una fila per línia, amb el badge de la línia, la destinació i els minuts.
   - Si ja hi havia una altra parada expandida, es col·lapsa.
10. Si la parada està **buida** (vehicles que no aproparan en breu), no apareix cap indicador especial.

### Vehicles al llistat

11. A la dreta del nom de la parada, quan un vehicle aproparà aquella parada com a *propera parada*, es pinta un **indicador**:
    - Icona reduïda del vehicle (la mateixa silueta sòlida que al mapa, **sense fletxa de direcció** perquè a la vertical de la llista no aporta) + text `↓ 3 min` en vermell.
    - Si n'hi ha diversos vehicles aproparants la mateixa parada (cas excepcional), es mostren apilats verticalment.
12. Quan canvia el conjunt de vehicles (per refresc), els indicadors s'actualitzen sense recarregar tota la llista.

### Refresc

13. El botó de refresc segueix sent el mateix `RefreshControl` (cooldown 2 min compartit). En clicar, refresc dels vehicles i l'estat d'arribades dels acordions oberts.

### Performance i robustesa

14. Si una línia té una sola direcció (`sentit` únic), la columna ocupa tot l'amplada disponible.
15. Si `parades = []` (encara està carregant), mostrar un skeleton.
16. El canvi entre mapa i llista no destrueix els hooks ni dispara noves crides — ja tenim tots els hooks compartits a `LiniesView`.

## 5. Non-Goals (Out of Scope)

- No es mostren temps d'arribada per a *totes* les parades de la llista de cop (només quan l'usuari clica). Això evitaria un esclat de crides.
- No s'afegeix cap nou endpoint backend.
- No es persisteix l'estat del toggle entre sessions del navegador.
- No s'afegeix scroll-to-stop automàtic quan apareix un vehicle nou (potser futur).
- No es mostren les correspondències a 5+ línies amb llistat sencer — només "+N" perquè no soroll·li.

## 6. Design Considerations

- **Toggle**: estil similar als controls existents del mapa, fons blanc + ombra, dues "tabs" amb icones SVG. Estats: actiu (fons groc clar) / inactiu (transparent).
- **Capçalera de columna**: fons gris molt suau (`#fafafa`), text de destí amb una fletxa `→`.
- **Fila de parada**: padding compacte, hover lleuger; en estat *expanded* el fons es torna `#fff` i hi ha una vora-esquerra de 3px del color de la línia.
- **Mini-badges de correspondència**: variant en miniatura de `.line-chip-badge` (mateixos colors i tipografia, però `min-width: 26px; height: 16px; font-size: 10px;`).
- **Indicador de vehicle**: icona del vehicle en `width: 24px` (la silueta sòlida, sense flip), darrere un text `↓ 3 min` amb color vermell `#c8001e` font-weight 800.
- **Estil acordió**: animar `max-height` per al desplegament; padding 8px 14px; line height compacta per a l'arribada de cada línia.

## 7. Technical Considerations

- Reutilitzar `useParades(liniaId)` ja existent — ens dóna les parades amb `sentit` i `ordre`.
- Reutilitzar `useTotesParades` (carregat al "Aprop meu") per a les correspondències, però fem fetch només quan entrem al mode llista (`enabled: showList`).
- Per cada parada expandida, fer servir `useTempsReal(tipus, liniaCodi=primaryLine, paradaCodi, enabled, all=true)` — l'endpoint ja accepta `?all=1` per retornar totes les línies.
- Compartir `vehiclesAmbPos` (ja computat a `LiniesView`) entre vista de mapa i de llista.
- La memòria del toggle viu al `LiniesView` com a `useState<'map' | 'list'>`.
- Per al match parades ↔ correspondències, agrupem `useTotesParades.parades` per `codi` i `tipus` (es comparteix l'identificador entre la línia actual i les altres línies que paren).
- Animacions amb CSS pur (transitions), sense framer-motion.

## 8. Success Metrics

- L'usuari pot canviar entre mapa i llista sense lag perceptible (< 100 ms).
- L'expansió d'una parada mostra arribades en < 1 s.
- Cap regressió sobre les funcionalitats existents del mapa.
- Cap nova crida HTTP per al toggle en si (només per a expandir parades, que ja és reutilitzada).
- 0 errors de "no es veuen vehicles" un cop la línia està seleccionada (la condició es testeja amb el bug-fix recent de `liniaId`).

## 9. Open Questions

1. Quan la línia és metro i no hi ha cap vehicle visible (cap arribada activa), no podem inferir el sentit pels vehicles. Mostrem una sola columna o intentem dividir per `nom_linia` parellatges (típicament metro té dos sentits estàtics)? Per defecte: una sola columna amb totes les estacions.
2. Quan hi ha múltiples vehicles aproparant la mateixa parada, l'apilament vertical pot inflar la fila. Limitem a 2 vehicles visibles + "+1" per evitar saltar layout?
3. La vista llista en mòbil (panell + llista molt estretes), com es comporta? Mantenim dues columnes o fem una de sola per sentit (selector dropdown)? Suggerència: en pantalla < 640 px, una sola columna amb selector de sentit a dalt.
4. Volem mostrar el **bus que acaba d'arribar** (Arribant) també al llistat o només els que falten ≥ 1 min? Per coherència amb el popup del mapa, sí: també "Arribant".
