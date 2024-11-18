/* eslint-disable-next-line no-console */
(async function main() {
  if (window.location.href.includes('/map-popup')) {
    // Skip adding sidebar to map popups.
    return;
  }

  const urlRegexesFromDrupal = (drupalSettings.farmos_asset_link.sidebar_url_patterns || []).map(pattern => new RegExp(pattern));

  const urlRegexesFromLocalStorageJson = localStorage.getItem('alink-sidebar-local-whitelist-patterns') || '{}';

  const urlRegexesFromLocalStorage = Object.values(JSON.parse(urlRegexesFromLocalStorageJson)).flatMap(l => l).map(([pattern, flags]) => new RegExp(pattern, flags));

  const urlRegexes = [...urlRegexesFromDrupal, ...urlRegexesFromLocalStorage];

  console.log(urlRegexes);

  const anyMatchingRegex = urlRegexes.find(re => re.test(window.location.href));

  if (!anyMatchingRegex) {
    console.log("No match returning without sidecar...");
    return;
  }

  const container = document.createElement('div');
  container.className = "quasar-style-wrap";
  container.setAttribute('data-quasar', '');
  container.style = "width: 1vw; height: 1vh; position: fixed; top: 0px; left: -100px;";
  document.body.appendChild(container);

  const sidebar = document.createElement('div');
  sidebar.id = "asset-link-floating-sidebar";
  container.appendChild(sidebar);

  // TODO: Honor base path here
  const data = await fetch('/alink/sidecar/assets-manifest.json');

  const json = await data.json();

  if (!json.entrypoints || !json.entrypoints.app || !json.entrypoints.app.assets || !json.entrypoints.app.assets.js) {
    return;
  }

  const requiredJsFiles = json.entrypoints.app.assets.js || [];

  for (const requiredJsFile of requiredJsFiles) {
    console.log("Importing sidecar...", requiredJsFile);
    // TODO: Honor base path here
    await import(`/alink/sidecar/${requiredJsFile}`);
  }
})();
