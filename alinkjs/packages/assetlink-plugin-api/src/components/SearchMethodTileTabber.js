import { computed, defineComponent, h, provide, ref, nextTick } from "vue";
import { QBtn, QBtnGroup } from "quasar";

// Copied from https://github.com/quasarframework/quasar/blob/30e051fcd5163f57b89d553ec5091c1c854e7e53/ui/src/utils/private/vm.js#L18-L40
function fillNormalizedVNodes(children, vnode) {
  if (typeof vnode.type === "symbol") {
    if (Array.isArray(vnode.children) === true) {
      vnode.children.forEach((child) => {
        fillNormalizedVNodes(children, child);
      });
    }
  } else {
    children.add(vnode);
  }
}

// vnodes from rendered in advanced slots
function getNormalizedVNodes(vnodes) {
  const children = new Set();

  vnodes.forEach((vnode) => {
    fillNormalizedVNodes(children, vnode);
  });

  return Array.from(children);
}

/**
 * Renders a set of toggleable buttons for each search method that occurs
 * in the default Vue slot of this component.
 *
 * ### Usage
 *
 * ```js
 * <search-method-tile-tabber v-model:search-method="currentSearchMethod">
 *   <search-method
 *     name="text-search"
 *     icon="mdi-keyboard">
 *     <template #search-interface>
 *       Text Search UI
 *     </template>
 *   </search-method>
 *   <search-method
 *     name="random-search"
 *     icon="mdi-dice-5">
 *     <template #search-interface>
 *       Random Search UI
 *     </template>
 *   </search-method>
 * </search-method-tile-tabber>
 * ```
 *
 * See [TODO]() for more details about implementing new search forms.
 *
 * @category components
 * @module SearchMethodTileTabber
 * @vue-prop {String} name - the name of the widget
 * @vue-prop {Object} context - the context to be passed to any widget decorate plugins
 */
const SearchMethodTileTabber = defineComponent({
  props: {
    searchMethod: { type: String, required: true },
  },
  emits: ["update:searchMethod"],
  setup(props, { slots, emit }) {
    const currentSearchMethod = ref(props.searchMethod);

    provide("currentSearchMethod", currentSearchMethod);

    const slotsContents = computed(() => {
      const contents = slots.default();

      // This is a bit of a hack, but necessary because the slot contents needs to be fully rendered
      // before we can traverse it for children to find the search-method tabs
      nextTick(() => {
        tabs.value = computeTabs(contents);
      });

      return contents;
    });

    const computeTabs = (contents) => {
      const foundTabs = [];

      const traverse = (nodes) => {
        const normalizedNodes = getNormalizedVNodes(nodes);

        normalizedNodes.forEach((n) => {
          if (n.component?.exposed?.isSearchMethod) {
            foundTabs.push({
              name: n.props.name,
              icon: n.props.icon,
              clickSignaler: n.component.exposed.tileClicked,
            });
          }

          const descendents = [];

          if (Array.isArray(n.children)) {
            descendents.push(...n.children);
          } else if (typeof n.children === "object" && n.children !== null) {
            descendents.push(...Object.values(n.children));
          }

          if (n.component?.subTree) {
            descendents.push(n.component.subTree);
          }
          traverse(descendents);
        });
      };

      traverse(contents);

      return foundTabs;
    };

    const tabs = ref([]);

    return () => {
      const buttonGroupChildren = [];

      tabs.value.forEach((m) => {
        buttonGroupChildren.push(
          h(QBtn, {
            push: true,
            color: "secondary",
            outline: currentSearchMethod.value === m.name,
            icon: m.icon,
            class: "q-py-lg",
            padding: "lg xs",
            size: "35px",
            onClick: () => {
              currentSearchMethod.value = m.name;
              emit("update:searchMethod", m.name);
              m.clickSignaler();
            },
          })
        );
      });

      const children = [];

      children.push(
        h(QBtnGroup, { push: true, spread: true }, () => buttonGroupChildren)
      );

      children.push(h("div", { class: "q-my-md" }, slotsContents.value));

      return h("div", { class: "text-center q-ma-md" }, children);
    };
  },
});

export default SearchMethodTileTabber;
