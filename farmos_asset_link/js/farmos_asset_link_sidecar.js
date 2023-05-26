/* eslint-disable-next-line no-console */
(async function main() {
  if (window.location.href.includes('/map-popup')) {
    // Skip adding sidebar to map popups.
    return;
  }
  const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);

  console.log(matches);

  if (!matches || matches.length < 2) {
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

  const requiredJsFiles = json.entrypoints?.app?.assets?.js || [];

  for (const requiredJsFile of requiredJsFiles) {
    console.log("Importing sidecar...", requiredJsFile);
    // TODO: Honor base path here
    await import(`/alink/sidecar/${requiredJsFile}`);
  }
})();
