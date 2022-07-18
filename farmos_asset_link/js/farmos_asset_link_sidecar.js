/* eslint-disable-next-line no-console */
(async function main() {
  const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);

  console.log(matches);

  if (!matches || matches.length < 2) {
    return;
  }

  const container = document.createElement('div');
  container.style = "width: 1vw; height: 1vh; position: fixed; top: 0px; left: 0px;";
  document.body.appendChild(container);

  const sidebar = document.createElement('div');
  sidebar.id = "asset-link-floating-sidebar";
  container.appendChild(sidebar);

  await import('/alink/sidecar/main.js');
})();
