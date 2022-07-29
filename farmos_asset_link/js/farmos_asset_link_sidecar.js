/* eslint-disable-next-line no-console */
(async function main() {
  const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);

  console.log(matches);

  if (!matches || matches.length < 2) {
    console.log("No match returning without sidecar...");
    return;
  }

  const container = document.createElement('div');
  container.className = "quasar-style-wrap";
  container.setAttribute('data-quasar', '');
  container.style = "width: 1vw; height: 1vh; position: fixed; top: 0px; left: 0px;";
  document.body.appendChild(container);

  const sidebar = document.createElement('div');
  sidebar.id = "asset-link-floating-sidebar";
  container.appendChild(sidebar);

  const data = await fetch('/alink/sidecar/assets-manifest.json');

  const json = await data.json();

  const requiredJsFiles = json.entrypoints?.app?.assets?.js || [];

  for (const requiredJsFile of requiredJsFiles) {
    console.log("Importing sidecar...", requiredJsFile);
    await import(`/alink/sidecar/${requiredJsFile}`);
  }
})();
