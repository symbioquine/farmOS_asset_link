

export default ({ app }) => {
//Based on https://dev.to/jakedohm_34/auto-registering-all-your-components-in-vue-3-with-vite-4884
  const components = import.meta.globEager('./components/*.vue');

  Object.entries(components).forEach(([path, definition]) => {
    // Get name of component, based on filename
    // "./components/Fruits.vue" will become "Fruits"
    const componentName = path.split('/').pop().replace(/\.\w+$/, '');

    // Register component on this Vue instance
    app.component(componentName, definition.default);
  });
}
