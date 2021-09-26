import Vue from 'vue';

const RenderFnWrapper = Vue.component('render-fn-wrapper', {
  props: {
    renderFn: { type: Function, required: true },
  },
  render(h) {
    return this.renderFn(this, h);
  },
});

export default RenderFnWrapper;
