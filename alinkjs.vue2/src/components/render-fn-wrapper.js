import Vue from 'vue';

const RenderFnWrapper = Vue.extend({
  props: {
    renderFn: { type: Function, required: true },
  },
  render(h) {
    return this.renderFn(this, h);
  },
});

export default RenderFnWrapper;
