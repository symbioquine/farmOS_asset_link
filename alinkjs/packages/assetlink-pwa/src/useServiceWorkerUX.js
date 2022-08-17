import { ref, onMounted, onUnmounted } from "vue";

// Roughly based on https://dev.to/drbragg/handling-service-worker-updates-in-your-vue-pwa-1pip
export function useServiceWorkerUX() {
  const registration = ref(null);
  const updateExists = ref(false);
  const refreshing = ref(false);

  // Store the SW registration so we can send it a message
  // We use `updateExists` to control whatever alert, toast, dialog, etc we want to use
  // To alert the user there is an update they need to refresh for
  const updateAvailable = (event) => {
    registration.value = event.detail;
    updateExists.value = true;
  };

  // Prevent multiple refreshes
  const onControllerChange = () => {
    if (refreshing.value) {
      return;
    }
    refreshing.value = true;
    // Here the actual reload of the page occurs
    window.location.reload();
  };

  // Listen for our custom event from the SW registration
  onMounted(() => {
    document.addEventListener("swUpdated", updateAvailable, { once: true });
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );
  });
  onUnmounted(() => {
    window.removeEventListener("swUpdated", updateAvailable);
    navigator.serviceWorker.removeEventListener(
      "controllerchange",
      onControllerChange
    );
  });

  // Called when the user accepts the update
  const refreshApp = () => {
    updateExists.value = false;
    // Make sure we only send a 'skip waiting' message if the SW is waiting
    if (!registration.value || !registration.value.waiting) {
      return;
    }
    // send message to SW to skip the waiting and activate the new SW
    registration.value.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  // expose updateExists state and refreshApp method
  return { updateExists, refreshApp };
}
