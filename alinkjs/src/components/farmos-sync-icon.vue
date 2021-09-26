<script>
import {
   VBadge,
   VIcon,
} from 'vuetify/lib'

export default {
  props: {
    dataAge: { type: String, default: '' },
  },
  inject: ['assetLink'],
  render(h) {
    const connectionStatus = this.assetLink.viewModel.connectionStatus;

    const chooseIcon = () => {
      if (!connectionStatus.hasNetworkConnection) {
        return "mdi-cloud-off-outline";
      }

      if (!connectionStatus.canReachFarmOS) {
        return "mdi-cloud-alert";
      }

      if (!connectionStatus.isLoggedIn) {
        return "mdi-cloud-lock";
      }

      return "mdi-cloud-sync";
    };

    const icon = chooseIcon();

    if (this.assetLink.viewModel.pendingUpdates.length > 0) {
      return h(VBadge, 
          {
            props: {
              color: "red",
              content: this.assetLink.viewModel.pendingUpdates.length,
              offsetX: 10,
              offsetY: 10,
            }
          }, [
            h(VIcon, icon)
          ]);
    }

    return h(VIcon, icon);
  },
};
</script>
