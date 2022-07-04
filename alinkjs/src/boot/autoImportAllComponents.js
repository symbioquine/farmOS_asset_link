// Based on https://dev.to/jakedohm_34/auto-registering-all-your-components-in-vue-3-with-vite-4884
export default ({ app }) => {
  // https://github.com/mrmlnc/fast-glob#pattern-syntax
  const components = import.meta.globEager('../components/*.{js,vue}');

  Object.entries(components).forEach(([path, definition]) => {
    // Get name of component, based on filename
    // "./components/Fruits.vue" will become "Fruits"
    const componentName = path.split('/').pop().replace(/\.\w+$/, '');

    // Register component on this Vue instance
    app.component(componentName, definition.default);
  });
}
