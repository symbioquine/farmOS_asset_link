<template>
  <q-drawer
    v-model="drawer"
    overlay
    bordered
    class="bg-grey-3"
  >
    <q-scroll-area class="fit">
      <q-list>

        <template v-for="(menuItem, index) in menuList" :key="index">
          <q-item clickable :active="menuItem.label === 'Outbox'" v-ripple>
            <q-item-section avatar>
              <q-icon :name="menuItem.icon" />
            </q-item-section>
            <q-item-section>
              {{ menuItem.label }}
            </q-item-section>
          </q-item>
          <q-separator :key="'sep' + index" v-if="menuItem.separator" />
        </template>

      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<script>
import { ref } from 'vue'

const menuList = [
  {
    icon: 'mdi-inbox',
    label: 'Inbox',
    separator: true
  },
  {
    icon: 'mdi-send',
    label: 'Outbox',
    separator: false
  },
  {
    icon: 'mdi-delete',
    label: 'Trash',
    separator: false
  },
  {
    icon: 'mdi-error',
    label: 'Spam',
    separator: true
  },
  {
    icon: 'mdi-gear',
    label: 'Settings',
    separator: false
  },
  {
    icon: 'mdi-feedback',
    label: 'Send Feedback',
    separator: false
  },
  {
    icon: 'mdi-help',
    iconColor: 'primary',
    label: 'Help',
    separator: false
  }
]

export default {
  setup () {
    return {
      drawer: ref(false),
      menuList
    }
  },
  methods: {
    toggle() {
      this.drawer = !this.drawer;
    }
  },
};
</script>
