<script setup>
import { inject, ref, onMounted, onUnmounted } from 'vue';

import { currentEpochSecond, parseJSONDate } from "assetlink-plugin-api";

const props = defineProps({
  asset: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

const loadingGroupMembers = ref(false);
const groupMembers = ref([]);

const resolveCurrentGroupMembers = async () => {
  loadingGroupMembers.value = true;

  const logTypes = (await assetLink.getLogTypes()).map(t => t.attributes.drupal_internal__id);

  const populateGroupMembersFromLatestMembershipLogs = async (entitySource, entitySourceCache) => {

    const results = await entitySource.query(q => logTypes.map(logType => {
      return q.findRecords(`log--${logType}`)
        .filter({ attribute: 'is_group_assignment', op: 'equal', value: true })
        .filter({ attribute: 'status', op: 'equal', value: 'done' })
        .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
        .filter({
          relation: 'group.id',
          op: 'some',
          records: [{ type: props.asset.type, id: props.asset.id }]
        })
        .sort('-timestamp');
    }), {
      sources: {
        remote: {
          include: ['asset']
        }
      }
    });

    const logs = results.flatMap(l => l);

    const allPossibleMembers = logs.flatMap(log => log.relationships?.asset?.data);

    const membershipLogQueryPromises = [];

    // Query the possible members' logs in chunks of 50 to avoid calling the server with too
    // long of a query URL
    const maxMembersToQuery = 50;
    for (let i = 0; i < allPossibleMembers.length; i += maxMembersToQuery) {
      const chunkOfPossibleMembers = allPossibleMembers.slice(i, i + maxMembersToQuery);

      membershipLogQueryPromises.push(entitySource.query(q => logTypes.map(logType => {
        const logTypeName = `log--${logType}`;
        return q.findRecords(logTypeName)
          .filter({ attribute: 'is_group_assignment', op: 'equal', value: true })
          .filter({ attribute: 'status', op: 'equal', value: 'done' })
          .filter({ attribute: 'timestamp', op: '<=', value: currentEpochSecond() })
          .filter({
            relation: 'asset.id',
            op: 'some',
            records: chunkOfPossibleMembers
          })
          .sort('-timestamp')
          .options({
            sources: {
              remote: {
                fields: {
                  [logTypeName]: ['name', 'timestamp'],
                },
              },
            }
          });
      })));
    }

    const membershipLogResults = await Promise.all(membershipLogQueryPromises);

    const logsForAllPossibleMembersByLogId = membershipLogResults.flatMap(l => l).flatMap(l => l).reduce(function(byId, log) {
      byId[log.id] = log;
      return byId;
    }, {});

    const logsForAllPossibleMembers = Object.values(logsForAllPossibleMembersByLogId);

    const currentMembers = allPossibleMembers.flatMap(possibleMember => {
          const latestLog = logsForAllPossibleMembers
              .filter(log => log.relationships.asset.data.find(a => a.id === possibleMember.id))
              .reduce((logA, logB) => parseJSONDate(logA.attributes.timestamp) > parseJSONDate(logB.attributes.timestamp) ? logA : logB);

          if (!latestLog.relationships.group.data.find(g => g.id === props.asset.id)) {
            return [];
          }

          const currentMember = entitySourceCache.query((q) => q.findRecord({ type: possibleMember.type, id: possibleMember.id }));

          if (currentMember.attributes.status === 'archived') {
            return [];
          }

          return [{ latestLogDate: parseJSONDate(latestLog.attributes.timestamp), member: currentMember}];
      })
      .sort((a, b) => (a.latestLogDate - b.latestLogDate) || parseJSONDate(a.member.attributes.created) - parseJSONDate(b.member.attributes.created))
      .map(m => m.member);

    groupMembers.value = currentMembers;
  }

  await populateGroupMembersFromLatestMembershipLogs(assetLink.entitySource.cache, assetLink.entitySource.cache);

  await populateGroupMembersFromLatestMembershipLogs(assetLink.entitySource, assetLink.entitySource.cache);

  loadingGroupMembers.value = false;
};

const onAssetLogsChanged = ({ assetType, assetId }) => {
  if (
    props.asset.type === assetType &&
    props.asset.id === assetId
  ) {
    resolveCurrentGroupMembers();
  }
};

let unsubber;
onMounted(() => {
  resolveCurrentGroupMembers();
  unsubber = assetLink.eventBus.$on("changed:assetLogs", onAssetLogsChanged);
});
onUnmounted(() => unsubber && unsubber.$off());
</script>

<template>
  <div>
    <h5 class="q-my-xs">Group Members:</h5>
    <div
      class="col"
      style="
        height: auto;
        min-height: 160px;
        height: 25vh;
        position: relative;
        contain: strict;
        overflow: auto;
      "
    >
      <q-tree
        node-key="id"
        :nodes="groupMembers"
        no-nodes-label="No group members found"
         class="q-ml-md"
      >
        <template v-slot:default-header="prop">
          <entity-name :entity="prop.node"></entity-name>
        </template>
      </q-tree>
    </div>
  </div>
</template>

<script>
export default {
  onLoad(handle) {
    handle.defineSlot('net.symbioquine.farmos_asset_link.slots.v0.actions', actionsSlot => {
      actionsSlot.type('page-slot');

      actionsSlot.showIf(({ asset }) => asset.type === 'asset--group');

      actionsSlot.component(handle.thisPlugin);
    });
  }
}
</script>
