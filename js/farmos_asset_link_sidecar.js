/* eslint-disable-next-line no-console */
(async function main() {
  const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);

  console.log(matches);

  if (!matches || matches.length < 2) {
    return;
  }

  const container = document.createElement('div');
  container.setAttribute('data-vuetify', '');
  container.style = "width: 1vw; height: 1vh; position: fixed; top: 0px; left: 0px;";
  document.body.appendChild(container);

  const sidebar = document.createElement('div');
  sidebar.id = "asset-link-floating-sidebar";
  container.appendChild(sidebar);

  function addStylesheet(url) {
    const link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    link.media = 'all';
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  addStylesheet('/alink/css/chunk-vendors.css');
  addStylesheet('https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900');
  addStylesheet('https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css');

  await import('/alink/js/chunk-vendors.js');
  await import('/alink/js/chunk-common.js');
  await import('/alink/js/sidecar.js');
})();
