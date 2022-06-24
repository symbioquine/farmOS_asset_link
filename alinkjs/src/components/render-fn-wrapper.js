import { defineComponent, h } from 'vue'

const RenderFnWrapper = defineComponent({
  props: {
    renderFn: { type: Function, required: true },
  },
  render() {
    return this.renderFn(this, h);
  },
});

export default RenderFnWrapper;
