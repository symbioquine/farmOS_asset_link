<template>
  <div class="container">
    <p>Page '{{ $route.path }}' not found!!</p>
  </div>
</template>

<script>
export default {
  routePath: '*',
};
</script>
