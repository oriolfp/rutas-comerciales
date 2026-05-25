# Tasks: TMB Línies i Mapa de Parades

## Relevant Files

- `src/main.tsx` - Punt d'entrada de l'aplicació React
- `src/App.tsx` - Component arrel amb el layout split-view principal
- `src/App.test.tsx` - Tests del component arrel
- `src/components/FilterBar.tsx` - Botons de filtre per tipus de transport
- `src/components/FilterBar.test.tsx` - Tests dels filtres
- `src/components/LineList.tsx` - Llistat de línies amb badge de color
- `src/components/LineList.test.tsx` - Tests del llistat
- `src/components/SearchInput.tsx` - Camp de cerca de línies
- `src/components/MapView.tsx` - Component del mapa Leaflet (tiles CartoDB Voyager)
- `src/components/StopMarker.tsx` - Marcador de parada al mapa
- `src/components/StopPopup.tsx` - Popup d'informació i temps real
- `src/hooks/useLinies.ts` - Hook per obtenir i filtrar línies de l'API
- `src/hooks/useParades.ts` - Hook per obtenir parades d'una línia
- `src/hooks/useTempsReal.ts` - Hook per obtenir temps real d'arribada
- `src/services/tmb.ts` - Funcions de crida a l'API de TMB (via proxy)
- `src/types/tmb.ts` - Tipus TypeScript (Linia, Parada, TempsReal)
- `.env.example` - Plantilla de variables d'entorn (commitejat)
- `.env.local` - Credencials reals de TMB (NO commitejat, afegir a .gitignore)
- `netlify/functions/_tmb.ts` - Lògica compartida (autenticació, fetch, normalització de GeoJSON)
- `netlify/functions/linies.ts` - Netlify Function proxy per a `GET /v1/transit/linies/{bus,metro}`
- `netlify/functions/parades.ts` - Netlify Function proxy per a `GET /v1/transit/linies/{tipus}/{id}/parades|estacions`
- `netlify/functions/temps-real.ts` - Netlify Function proxy unificat per a temps real (iBus per a bus, iMetro per a metro); ruta `/api/temps-real/{tipus}/{linia}/{parada}` amb mode `?debug=1` per depurar respostes crues de TMB
- `netlify.toml` - Configuració de Netlify (redirects `/api/*` → functions)
- `vite.config.ts` - Configuració de Vite

### Notes

- Tests unitaris col·locats al costat dels arxius que proven (`Component.tsx` → `Component.test.tsx`).
- Usar `npm test` per executar els tests.
- Les credencials de l'API de TMB mai s'han de commitejar. Usar `.env.local` localment i GitHub Secrets per al desplegament.
- Verificar CORS de l'API TMB abans de la tasca 2: si no permet crides des del navegador, caldrà un proxy lleuger via Netlify Functions (pla gratuït).

## Instructions for Completing Tasks

**IMPORTANT:** A mesura que completis cada tasca, marca-la canviant `- [ ]` per `- [x]`.

Exemple:
- `- [ ] 1.1 Inicialitzar projecte` → `- [x] 1.1 Inicialitzar projecte` (després de completar)

Actualitza l'arxiu després de cada sub-tasca, no només al final de la tasca pare.

---

## Tasks

- [x] 0.0 Crear la branca de la feature
  - [x] 0.1 Crear i fer checkout de la branca `feature/tmb-linies-mapa` des de `main`
  - [x] 0.2 Fer push de la branca buida al remot per establir el tracking

- [x] 1.0 Configuració inicial del projecte (React + Vite + Netlify)
  - [x] 1.1 Inicialitzar el projecte amb `npm create vite@latest` seleccionant React + TypeScript
  - [x] 1.2 Instal·lar dependències: `leaflet`, `react-leaflet`, `@types/leaflet`
  - [x] 1.3 Instal·lar Netlify CLI (`npm install -g netlify-cli`) per poder desenvolupar les functions en local _(opcional: la verificació es fa directament a la URL de Netlify)_
  - [x] 1.4 Crear l'arxiu `.env.example` amb les variables `TMB_APP_ID` i `TMB_APP_KEY` buides (sense prefix `VITE_`, ja que les usaran les functions serverless, no el client)
  - [x] 1.5 Afegir `.env.local` al `.gitignore`
  - [x] 1.6 Crear l'estructura de carpetes: `src/components/`, `src/hooks/`, `src/services/`, `src/types/`, `netlify/functions/`
  - [x] 1.7 Crear `netlify.toml` amb la configuració de build i els redirects `/api/*` cap a les functions
  - [x] 1.8 Verificar que `netlify dev` arrenca correctament (substitueix `npm run dev` en local) _(opcional: depèn de 1.3)_

- [x] 2.0 Proxy Netlify Functions + Integració amb l'API de TMB
  - [x] 2.1 Registrar-se a developer.tmb.cat i obtenir `app_id` i `app_key` gratuïts; afegir-los a `.env.local`
  - [x] 2.2 Crear `netlify/functions/linies.ts`: rep la petició del frontend, crida `api.tmb.cat/v1/transit/linies` amb les credencials des de variables d'entorn, retorna el JSON
  - [x] 2.3 Crear `netlify/functions/parades.ts`: rep `liniaId` com a paràmetre, crida `api.tmb.cat/v1/transit/linies/{id}/parades`, retorna el JSON
  - [x] 2.4 Verificar les functions en local amb `netlify dev` i comprovar que `/api/linies` retorna dades correctes _(opcional: substituït per verificació directa a la URL de Netlify)_
  - [x] 2.5 Definir els tipus TypeScript a `src/types/tmb.ts` (Linia, Parada, TempsReal) a partir de la resposta real de l'API
  - [x] 2.6 Crear `src/services/tmb.ts` amb `getLinies()` i `getParades(liniaId)` que criden `/api/linies` i `/api/parades/:id` (les functions del proxy)
  - [x] 2.7 Crear el hook `src/hooks/useLinies.ts` que crida `getLinies()` i gestiona loading/error
  - [x] 2.8 Crear el hook `src/hooks/useParades.ts` que crida `getParades()` quan canvia la línia seleccionada

- [x] 3.0 Llistat de línies amb filtres i cerca
  - [x] 3.1 Crear el component `FilterBar.tsx` amb botons per a cada tipus de transport (Tots, Metro, Bus, Tramvia, FGC, Rodalies)
  - [x] 3.2 Crear el component `SearchInput.tsx` amb un input de text per cercar per nom o identificador de línia
  - [x] 3.3 Crear el component `LineList.tsx` que renderitza cada línia amb badge de color, nom, tipus i nombre de parades
  - [x] 3.4 Implementar la lògica de filtratge per tipus i cerca per text al hook `useLinies.ts`
  - [x] 3.5 Afegir l'estat de selecció de línia i ressaltat visual de la línia activa
  - [x] 3.6 Mostrar un estat de càrrega (skeleton o spinner) mentre s'obtenen les línies de l'API
  - [x] 3.7 Mostrar un missatge d'error si la crida a l'API falla

- [x] 4.0 Mapa interactiu amb Leaflet i parades
  - [x] 4.1 Crear el component `MapView.tsx` amb el mapa de Leaflet centrat a Barcelona (lat: 41.3874, lng: 2.1686, zoom: 13)
  - [x] 4.2 Configurar els tiles de **CartoDB Voyager** (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`, subdominis `a–d`) amb l'atribució OpenStreetMap + CARTO. (Es prefereix Voyager pel seu look and feel net i amb colors apagats que destaquen les polilínies de les línies.)
  - [x] 4.3 Crear el component `StopMarker.tsx` que renderitza un marcador circular amb el color de la línia
  - [x] 4.4 Crear el component `StopPopup.tsx` que mostra nom de la parada i badge de la línia (el temps real s'afegirà a la tasca 5)
  - [x] 4.5 Dibuixar la polilínia del recorregut entre parades amb el color de la línia seleccionada
  - [x] 4.6 Fer zoom automàtic (`fitBounds`) al recorregut complet de la línia quan es selecciona
  - [x] 4.7 Marcar les parades terminals (primera i última) amb un marcador més gran

- [x] 5.0 Dades en temps real d'arribada de vehicles
  - [x] 5.1 Verificar la disponibilitat gratuïta de l'endpoint iBus (`GET /v1/ibus/lines/{line}/stops/{stop}`) amb les credencials obtingudes _(confirmat 200 OK i amb arribades reals)_
  - [x] 5.2 Si és accessible: crear `netlify/functions/temps-real.ts` com a proxy per a l'endpoint iBus
  - [x] 5.3 Crear `src/hooks/useTempsReal.ts` que crida `/api/temps-real` en obrir el popup d'una parada
  - [x] 5.4 Afegir el temps d'arribada (en minuts) al `StopPopup.tsx`
  - [x] 5.5 Implementar refresc automàtic de les dades cada 30 segons mentre el popup és obert
  - [x] 5.6 Si l'endpoint NO és gratuït: mostrar al popup un missatge "Temps real no disponible" i documentar-ho al README
  - [x] 5.7 **iMetro**: integrar temps real per a estacions de metro via `GET /v1/itransit/metro/estacions?estacions={codi_estacio}`. Parser que recorre `data.linies[].estacions[].linies_trajectes[].propers_trens[]` i calcula minuts a partir de `temps_arribada - timestamp` ("Arribant" si <30s).
  - [x] 5.8 Refactor de l'API del proxy: `/api/temps-real/{tipus}/{linia}/{parada}` perquè enruti a iBus o iMetro segons el tipus de línia, i retorni un missatge clar per a modes sense temps real (tram, FGC, Rodalies).

- [x] 6.0 Responsive: layout mòbil
  - [x] 6.1 Implementar el layout split-view per a escriptori: panell lateral (320px) + mapa (resta d'amplada)
  - [x] 6.2 Implementar el layout mòbil (<640px): mapa a la part superior (55vh) + panell inferior amb scroll (45vh)
  - [x] 6.3 Verificar que el mapa crida `invalidateSize()` quan el layout canvia per evitar renderitzats incorrectes
  - [x] 6.4 Testar en Chrome i Firefox a escriptori i mòbil (mínim 390px d'amplada)

- [x] 7.0 Desplegament a Netlify
  - [x] 7.1 Connectar el repositori de GitHub a Netlify des del panell de Netlify
  - [x] 7.2 Configurar el build command (`npm run build`) i el publish directory (`dist`) a Netlify
  - [x] 7.3 Afegir `TMB_APP_ID` i `TMB_APP_KEY` com a variables d'entorn al panell de Netlify (Site Settings → Environment Variables)
  - [x] 7.4 Fer el primer desplegament i verificar que les Netlify Functions responen correctament
  - [x] 7.5 Verificar que l'app funciona correctament a l'URL de Netlify (`.netlify.app`)
