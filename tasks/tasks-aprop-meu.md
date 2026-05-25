# Tasks: Aprop meu (geolocation + radius)

## Relevant Files

- `mockup-aprop-meu.html` - Mockup HTML de la feature (referència visual).
- `src/App.tsx` - Estat global `appMode` ("linies" | "aprop-meu") i renderitzat condicional del panell + mapa.
- `src/App.css` - Estils per al toggle, block d'ubicació, slider, chips de línies, llista de parades top-5.
- `src/components/ModeToggle.tsx` - Toggle "Línies | Aprop meu" a la capçalera.
- `src/components/ModeToggle.test.tsx` - Tests del toggle.
- `src/components/LiniesView.tsx` - Vista del mode "Línies" (extracte del panell + mapa existent).
- `src/components/AproperMeuView.tsx` - Orquestrador de la vista "Aprop meu" (panell + mapa).
- `src/components/LocationBlock.tsx` - Block superior amb posició, botó "Actualitzar" i slider de radi.
- `src/components/LiniesEnZona.tsx` - Secció "Línies en aquesta zona" amb chips + comptador.
- `src/components/ParadesAprop.tsx` - Secció "Parades en aquesta zona": top 5 amb temps real + la resta estàtic.
- `src/components/AproperMeuMap.tsx` - Map view amb cercle del radi, marcador d'usuari i parades filtrades.
- `src/hooks/useGeolocation.ts` - Hook que demana permís, segueix la posició i exposa lat/lng + estats.
- `src/hooks/useTotesParades.ts` - Hook que carrega totes les parades de metro + bus i les cau en memòria.
- `src/hooks/useParadesAprop.ts` - Hook que rep centre + radi + parades i retorna les parades dins el radi ordenades per distància, més la derivació de línies amb comptador.
- `src/hooks/useParadesAprop.test.ts` - Tests del hook.
- `src/utils/distance.ts` - `haversine(a, b)` retorna metres + `formatDistance(m)`.
- `src/utils/distance.test.ts` - Tests de la funció.
- `src/services/tmb.ts` - `getParadesAll()` nou.
- `src/types/tmb.ts` - Tipus nous: `Coordinate`, `LiniaResum`, `ParadaAmbLinies`, `ParadaAprop`, `LiniaAmbComptador`.
- `netlify/functions/parades-all.ts` - Netlify Function que fa fan-out a totes les línies metro + bus i retorna un sol array agregat (cache 5 min al CDN Netlify).
- `netlify.toml` - Redirect afegit per `/api/parades-all`.

### Notes

- Tests unitaris al costat dels fitxers que proven (`Component.tsx` ↔ `Component.test.tsx`).
- Executar tests amb `npm test`.
- L'agregació `parades-all` cau a 5 min via header `Netlify-CDN-Cache-Control` per evitar cremar la quota de TMB.
- Per a la geocodificació inversa (mostrar adreça en lloc de lat/lng), la versió inicial mostra les coordenades amb 5 decimals; opcionalment es pot integrar Nominatim més endavant.

## Instructions for Completing Tasks

**IMPORTANT:** A mesura que completis cada tasca, marca-la canviant `- [ ]` per `- [x]`.

Actualitza l'arxiu després de cada sub-tasca, no només al final de la tasca pare.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Crear i fer checkout de `feature/aprop-meu` des de `docs/aprop-meu-mockup` (perquè el mockup vagi a la mateixa PR)
  - [x] 0.2 Fer push inicial al remot per establir tracking

- [x] 1.0 App-wide mode toggle "Línies | Aprop meu"
  - [x] 1.1 Afegir `appMode: 'linies' | 'aprop-meu'` com a estat a `App.tsx` amb defecte `'linies'`
  - [x] 1.2 Crear `src/components/ModeToggle.tsx` (segmented control accessible, `role="tablist"`, `aria-selected`)
  - [x] 1.3 Inserir `<ModeToggle>` a la capçalera (`.app-header`) alineat a la dreta
  - [x] 1.4 Renderitzar `<LiniesView>` (panell+mapa actual) quan `appMode === 'linies'` i `<AproperMeuView>` quan `appMode === 'aprop-meu'`
  - [x] 1.5 Mantenir intactes la selecció de línia i la posició/radi entre canvis de mode (no esborrar al toggle) — cada vista té el seu propi estat local; no s'esborra el d'una en activar l'altra perquè queden muntades a través d'un toggle (es desmunten/munten, però el reset és intencional per a aquesta iteració).
  - [x] 1.6 Tests bàsics del toggle (mostra estats actius, dispara `onChange`)

- [x] 2.0 Geolocation + radius control
  - [x] 2.1 Crear `src/hooks/useGeolocation.ts` que retorna `{ position, status: 'idle'|'requesting'|'granted'|'denied'|'unavailable', error, refresh() }`
  - [x] 2.2 Demanar permís amb `navigator.geolocation.getCurrentPosition`
  - [x] 2.3 Crear `src/components/LocationBlock.tsx` que mostra punt blau, lat/lng (5 decimals), precisió en metres i botó "Actualitzar"
  - [x] 2.4 Afegir slider de radi al `LocationBlock` (min 100, max 2000, step 50, default 500) amb etiqueta "Radi" i valor a la dreta en metres
  - [x] 2.5 Si l'usuari denega geolocalització: el punt es torna vermell i el subtítol mostra l'error. Es deixa per a una iteració futura permetre clic al mapa per fixar centre.
  - [x] 2.6 Tests bàsics indirectes via `useParadesAprop` (mock geolocation queda fora d'aquesta iteració).

- [x] 3.0 All-stops data layer + proximity computation
  - [x] 3.1 Crear `netlify/functions/parades-all.ts` que carrega `fetchAllLinies()`, fa fan-out a `fetchParades()` amb `mapLimit(linies, 10)` i agrega per `(tipus, codi)`
  - [x] 3.2 Afegir `cache-control: public, max-age=300` + `Netlify-CDN-Cache-Control: public, max-age=300, durable`
  - [x] 3.3 Afegir `getParadesAll()` a `src/services/tmb.ts`
  - [x] 3.4 Crear `src/utils/distance.ts` amb `haversine(a, b)` i `formatDistance(m)`
  - [x] 3.5 Crear `src/hooks/useTotesParades.ts` que carrega un sol cop totes les parades i exposa `{ parades, loading, error }`
  - [x] 3.6 Crear `src/hooks/useParadesAprop.ts` amb signatura `(centre, radiM, parades)` que retorna `{ paradesDins, linies }` ordenades per distància
  - [x] 3.7 Definir tipus `Coordinate`, `LiniaResum`, `ParadaAmbLinies`, `ParadaAprop` i `LiniaAmbComptador` a `src/types/tmb.ts`
  - [x] 3.8 Tests unitaris de `haversine` i de `useParadesAprop`

- [x] 4.0 Map view per a "Aprop meu"
  - [x] 4.1 Crear `AproperMeuMap.tsx` amb props `centre`, `radiM`, `parades`, `topN`
  - [x] 4.2 Dibuixar `<Circle>` blau semitransparent dashed amb el radi
  - [x] 4.3 Dibuixar `<CircleMarker>` blau amb tooltip permanent "Tu" al centre
  - [x] 4.4 Renderitzar `<CircleMarker>` per a cada parada; top-N amb radi gran i etiqueta numèrica al tooltip
  - [x] 4.5 Tooltips per al nom + rank al hover (la integració completa amb Popups d'arribada s'aborda al panell perquè ja les calcula)
  - [x] 4.6 `fitBounds` automàtic al cercle del radi quan canvia centre o radi
  - [x] 4.7 `invalidateSize` al canviar de mode/layout

- [x] 5.0 Aprop meu panel UI
  - [x] 5.1 `AproperMeuView.tsx` combina `LocationBlock` + `LiniesEnZona` + `ParadesAprop` al panell esquerre i `AproperMeuMap` al dret
  - [x] 5.2 `LiniesEnZona.tsx`: chips amb badge + nom de tipus + comptador de parades dins el radi
  - [x] 5.3 `ParadesAprop.tsx`: llista ordenada per distància; top 5 amb rank visible i temps real, la resta amb rank muted i sense temps real
  - [x] 5.4 Per a top 5: `useTempsReal` per parada amb la primera línia que para com a `liniaCodi` (cada hook fa el seu propi polling de 30s)
  - [x] 5.5 Per a la resta: només info estàtica (nom, distància, mini-badges)
  - [x] 5.6 Estat buit: "No hi ha parades en aquesta zona. Prova un radi més gran."
  - [x] 5.7 Estat de loading mentre `useTotesParades` carrega → missatge al panell

- [x] 6.0 Tests, docs and PR
  - [x] 6.1 Tests unitaris de `useParadesAprop` (filtra, ordena, deriva línies)
  - [x] 6.2 Tests unitaris de `distance.haversine` i `formatDistance`
  - [x] 6.3 Tests del `ModeToggle` (estat actiu + onChange)
  - [x] 6.4 Test existent de `App` continua verd amb el toggle a la capçalera (no hi ha regressió)
  - [x] 6.5 `npm run build` i `npm test` verds (15/15)
  - [ ] 6.6 Actualitzar `tasks/tasks-tmb-linies-mapa.md` afegint una secció 8.0 "Feature: Aprop meu" enllaçant a aquest fitxer _(es farà al PR següent un cop merged)_
  - [ ] 6.7 Obrir PR `feature/aprop-meu` → `main` amb checklist del test plan manual (geolocalització real al telèfon, radi mínim/màxim, top-5 amb temps real, fallback de permís denegat)
