<template>
  <page-test v-if="category === 'test'"/>
</template>

<script setup lang="ts">
import PageTest from "~/components/tool/PageTest.vue";

const props = defineProps<{ category: string }>();
</script>
