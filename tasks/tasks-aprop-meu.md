# Tasks: Aprop meu (geolocation + radius)

## Relevant Files

- `mockup-aprop-meu.html` - Mockup HTML de la feature (referència visual).
- `src/App.tsx` - Estat global `appMode` ("linies" | "aprop-meu") i renderitzat condicional del panell + mapa.
- `src/App.css` - Estils per al toggle, block d'ubicació, slider, chips de línies, llista de parades top-5.
- `src/components/ModeToggle.tsx` - Toggle "Línies | Aprop meu" a la capçalera.
- `src/components/ModeToggle.test.tsx` - Tests del toggle.
- `src/components/LocationBlock.tsx` - Block superior amb posició, botó "Actualitzar" i slider de radi.
- `src/components/LocationBlock.test.tsx` - Tests del block d'ubicació.
- `src/components/LiniesEnZona.tsx` - Secció "Línies en aquesta zona" amb chips + comptador.
- `src/components/LiniesEnZona.test.tsx` - Tests del component.
- `src/components/ParadesAprop.tsx` - Secció "Parades en aquesta zona": top 5 amb temps real + la resta estàtic.
- `src/components/ParadesAprop.test.tsx` - Tests del component.
- `src/components/AproperMeuView.tsx` - Orquestrador de la vista "Aprop meu" (combina panell + mapa).
- `src/components/MapView.tsx` - Estendre per acceptar mode "aprop-meu" (centre, radi, parades, topN) o crear `MapAproperMeu.tsx`.
- `src/hooks/useGeolocation.ts` - Hook que demana permís, segueix la posició i exposa lat/lng + estats.
- `src/hooks/useGeolocation.test.ts` - Tests del hook (amb mock de `navigator.geolocation`).
- `src/hooks/useTotesParades.ts` - Hook que carrega totes les parades de metro + bus i les cau en memòria.
- `src/hooks/useTotesParades.test.ts` - Tests del hook.
- `src/hooks/useParadesAprop.ts` - Hook que rep centre + radi + parades i retorna les parades dins el radi ordenades per distància, més la derivació de línies amb comptador.
- `src/hooks/useParadesAprop.test.ts` - Tests del hook.
- `src/utils/distance.ts` - Funció `haversine(lat1, lng1, lat2, lng2)` que retorna metres.
- `src/utils/distance.test.ts` - Tests de la funció.
- `src/services/tmb.ts` - Afegir `getParadesAll()` que crida la nova Netlify Function.
- `src/types/tmb.ts` - Tipus nous: `ParadaAmbLinies`, `ParadaAprop` (amb `distanciaM` i `ordreProximitat`), `Coordinate`.
- `netlify/functions/parades-all.ts` - Netlify Function que fa fan-out a totes les línies metro + bus i retorna un sol array agregat (amb cache 5 min via `cache-control`).
- `tasks/tasks-tmb-linies-mapa.md` - Afegir referència creuada a aquesta feature.

### Notes

- Tests unitaris al costat dels fitxers que proven (`Component.tsx` ↔ `Component.test.tsx`).
- Executar tests amb `npm test`.
- L'agregació `parades-all` és l'única manera barata d'aconseguir "totes les parades a la vegada"; cau a 5 min per evitar cremar la quota de TMB.
- Per a la geocodificació inversa (mostrar adreça en lloc de lat/lng), la versió inicial pot mostrar les coordenades amb 5 decimals; opcionalment es pot integrar Nominatim més endavant.

## Instructions for Completing Tasks

**IMPORTANT:** A mesura que completis cada tasca, marca-la canviant `- [ ]` per `- [x]`.

Actualitza l'arxiu després de cada sub-tasca, no només al final de la tasca pare.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Crear i fer checkout de `feature/aprop-meu` des de `docs/aprop-meu-mockup` (perquè el mockup vagi a la mateixa PR)
  - [ ] 0.2 Fer push inicial al remot per establir tracking

- [ ] 1.0 App-wide mode toggle "Línies | Aprop meu"
  - [ ] 1.1 Afegir `appMode: 'linies' | 'aprop-meu'` com a estat a `App.tsx` amb defecte `'linies'`
  - [ ] 1.2 Crear `src/components/ModeToggle.tsx` (segmented control accessible, `role="tablist"`, `aria-selected`)
  - [ ] 1.3 Inserir `<ModeToggle>` a la capçalera (`.app-header`) alineat a la dreta
  - [ ] 1.4 Renderitzar `<MainView>` (panell+mapa actual) quan `appMode === 'linies'` i `<AproperMeuView>` quan `appMode === 'aprop-meu'`
  - [ ] 1.5 Mantenir intactes la selecció de línia i la posició/radi entre canvis de mode (no esborrar al toggle)
  - [ ] 1.6 Tests bàsics del toggle (mostra estats actius, dispara `onChange`)

- [ ] 2.0 Geolocation + radius control
  - [ ] 2.1 Crear `src/hooks/useGeolocation.ts` que retorna `{ position, status: 'idle'|'requesting'|'granted'|'denied'|'unavailable', error, refresh() }`
  - [ ] 2.2 Demanar permís amb `navigator.geolocation.getCurrentPosition`; opcionalment `watchPosition` darrere d'una flag (consum de bateria)
  - [ ] 2.3 Crear `src/components/LocationBlock.tsx` que mostra punt blau, lat/lng (5 decimals), precisió en metres i botó "Actualitzar"
  - [ ] 2.4 Afegir slider de radi al `LocationBlock` (min 100, max 2000, step 50, default 500) amb etiqueta "Radi" i valor a la dreta en metres
  - [ ] 2.5 Si l'usuari denega geolocalització: mostrar missatge "Cal permís d'ubicació" amb link de re-intent i un fallback per fer **clic al mapa** per fixar el centre (suport bàsic, no obligatori en aquesta iteració)
  - [ ] 2.6 Tests del hook (mock `navigator.geolocation`) i del component (estats granted/denied/loading)

- [ ] 3.0 All-stops data layer + proximity computation
  - [ ] 3.1 Crear `netlify/functions/parades-all.ts` que carrega `/api/linies`, fa fan-out a `/v1/transit/linies/metro/{id}/estacions` i `/v1/transit/linies/bus/{id}/parades` amb `Promise.all` (limitant concurrència, ex. 8) i retorna un sol array de parades amb les línies que les serveixen agrupades
  - [ ] 3.2 Afegir `cache-control: public, max-age=300` a la resposta perquè Netlify CDN cachegi 5 min
  - [ ] 3.3 Afegir `getParadesAll()` a `src/services/tmb.ts` que crida `/api/parades-all`
  - [ ] 3.4 Crear `src/utils/distance.ts` amb `haversine(a, b)` retornant metres
  - [ ] 3.5 Crear `src/hooks/useTotesParades.ts` que carrega un sol cop totes les parades i exposa `{ parades, loading, error }`
  - [ ] 3.6 Crear `src/hooks/useParadesAprop.ts` amb signatura `(centre, radiM, parades)` que retorna `{ paradesDins: ParadaAprop[], linies: LiniaAmbComptador[] }` ordenades per distància
  - [ ] 3.7 Definir tipus `ParadaAmbLinies`, `ParadaAprop` (amb `distanciaM`) i `LiniaAmbComptador` a `src/types/tmb.ts`
  - [ ] 3.8 Tests unitaris del `haversine` (pares de coordenades conegudes) i de `useParadesAprop` (filtra correctament, ordena per distància, agrupa línies)

- [ ] 4.0 Map view per a "Aprop meu"
  - [ ] 4.1 Estendre `MapView.tsx` (o crear `MapAproperMeu.tsx`) per acceptar props `centre: [lat,lng] | null`, `radiM: number`, `parades: ParadaAprop[]`, `topN: number`
  - [ ] 4.2 Dibuixar `<Circle>` de Leaflet centrat al `centre` amb el `radiM` (color blau, semitransparent, dashed)
  - [ ] 4.3 Dibuixar un marcador d'usuari (CircleMarker blau amb halo) al `centre`
  - [ ] 4.4 Renderitzar `<StopMarker>` per a cada parada dins del radi; les `topN` primeres amb radi més gran i amb un label numèric (1–5) visible
  - [ ] 4.5 Reusar Tooltip on hover (nom + línies) i Popup on clic (temps real per a les top 5)
  - [ ] 4.6 `fitBounds` automàtic al cercle del radi quan canviï el centre o el radi
  - [ ] 4.7 Cridar `invalidateSize()` al canviar de mode perquè Leaflet recalculi (igual que ja fem al canvi de layout mobile)

- [ ] 5.0 Aprop meu panel UI
  - [ ] 5.1 Crear `src/components/AproperMeuView.tsx` que combina `LocationBlock` + `LiniesEnZona` + `ParadesAprop` al panell esquerre i `MapView` al dret
  - [ ] 5.2 Crear `src/components/LiniesEnZona.tsx`: chips amb badge de color + nom + tipus + comptador de parades dins el radi
  - [ ] 5.3 Crear `src/components/ParadesAprop.tsx`: llista ordenada per distància, amb `stop-rank` numèric 1-5 destacat per a les top 5 i muted per a la resta
  - [ ] 5.4 Per a top 5: cridar `useTempsReal` per cada parada (un hook per parada està bé; React deduplica i les crides es paral·lelitzen). Mostrar la propera arribada (línia + destí + minuts) inline a la dreta de l'item.
  - [ ] 5.5 Per a la resta: només info estàtica (nom, distància, mini-badges de línies que paren). Cap crida de temps real.
  - [ ] 5.6 Estat buit: si no hi ha cap parada dins el radi → "No hi ha parades en aquesta zona. Prova un radi més gran."
  - [ ] 5.7 Estat de loading mentre `useTotesParades` carrega → skeleton al panell

- [ ] 6.0 Tests, docs and PR
  - [ ] 6.1 Tests unitaris de `useGeolocation` (mock `navigator.geolocation`, estats granted/denied/unavailable)
  - [ ] 6.2 Tests unitaris de `distance.haversine` (Pl. Catalunya ↔ Sagrada Família ≈ 1.8 km, etc.)
  - [ ] 6.3 Tests unitaris de `useParadesAprop` (filtra, ordena, deriva línies)
  - [ ] 6.4 Tests bàsics de `ModeToggle`, `LocationBlock`, `LiniesEnZona`, `ParadesAprop`
  - [ ] 6.5 Smoke test del `<App>` en mode "aprop-meu" (renderitza panell + mapa sense crash quan geolocalització està mockada)
  - [ ] 6.6 Verificar `npm run build` i `npm test` verds
  - [ ] 6.7 Actualitzar `tasks/tasks-tmb-linies-mapa.md` afegint una secció 8.0 "Feature: Aprop meu" enllaçant a aquest fitxer
  - [ ] 6.8 Obrir PR `feature/aprop-meu` → `main` amb captures del mockup i checklist del test plan manual (geolocalització real al telèfon, radi mínim/màxim, top-5 amb temps real, fallback de permís denegat)
