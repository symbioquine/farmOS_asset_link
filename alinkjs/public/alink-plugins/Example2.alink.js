import { defineComponent, defineAsyncComponent } from 'vue'

const f = async () => {
  const { color } = await import('asset-link/utils');
  alert(`Hi the color is ${color()}`);
};

f();

export default name = 'square';