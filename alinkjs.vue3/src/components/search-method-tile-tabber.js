import { defineComponent, h, provide, onMounted, ref } from 'vue';
import { QBtn, QBtnGroup } from 'quasar';

// Copied from https://github.com/quasarframework/quasar/blob/30e051fcd5163f57b89d553ec5091c1c854e7e53/ui/src/utils/private/vm.js#L18-L40
function fillNormalizedVNodes (children, vnode) {
  if (typeof vnode.type === 'symbol') {
    if (Array.isArray(vnode.children) === true) {
      vnode.children.forEach(child => {
        fillNormalizedVNodes(children, child)
      })
    }
  }
  else {
    children.add(vnode)
  }
}

// vnodes from rendered in advanced slots
function getNormalizedVNodes (vnodes) {
  const children = new Set()

  vnodes.forEach(vnode => {
    fillNormalizedVNodes(children, vnode)
  })

  return Array.from(children)
}

const SearchMethodTileTabber = defineComponent({
  props: {
    currentSearchMethod: { type: String, required: true },
  },
  emits: [
    'update:currentSearchMethod'
  ],
  setup(props, { slots, emit }) {
    provide('currentSearchMethod', props.currentSearchMethod);

    const slotsContents = slots.default();

    const tabs = ref([]);

    onMounted(() => {
      const foundTabs = [];

      const traverse = (nodes) => {
        const normalizedNodes = getNormalizedVNodes(nodes);

        normalizedNodes.forEach(n => {
          if (n.component?.exposed?.isSearchMethod) {
            foundTabs.push({
              name: n.props.name,
              icon: n.props.icon,
            });
          }

          const descendents = [];

          if (Array.isArray(n.children)) {
            descendents.push(...n.children);
          } else if (typeof n.children === 'object' && n.children !== null) {
            descendents.push(...Object.values(n.children));
          }

          if (n.component?.subTree) {
            descendents.push(n.component.subTree);
          }
          traverse(descendents);
        });
      };

      traverse(slotsContents);

      tabs.value = foundTabs;
    });

    return () => {
      const buttonGroupChildren = [];

      tabs.value.forEach(m => {
        buttonGroupChildren.push(h(QBtn, {
          push: true,
          color: "secondary",
          outline: props.currentSearchMethod === m.name,
          icon: m.icon,
          'class': "q-py-lg",
          size: "35px",
          onClick: () => { emit('update:currentSearchMethod', m.name); },
        }));
      });

      const children = [];

      children.push(h(QBtnGroup, { push: true, spread: true }, () => buttonGroupChildren));

      children.push(h('div', { class: "q-my-md" }, slotsContents));

      return h('div', { class: "text-center q-ma-md" }, children);
    };
  },
});

export default SearchMethodTileTabber;
