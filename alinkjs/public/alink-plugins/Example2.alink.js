import { defineComponent, defineAsyncComponent } from 'vue'

const f = async () => {
  const { color } = await import('asset-link/utils');
  console.log(`Hi the color is ${color()}`);
};

f();

export default name = 'square';