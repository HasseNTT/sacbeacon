<template>
  <div class="button-content" @click="$emit('click')">
    <p>{{ text }}</p>
    <component :is="icon" v-if="icon" />
  </div>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String,
    default: 'Button',
  },
  icon: {
    type: Object,
    default: null,
  },
})

defineEmits(['click'])
</script>

<style scoped>
.button-content {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  color: #354a5f;
  padding: 8px 15px;
  border-radius: 5px;
  height: fit-content;
  font-size: 13px;
  font-weight: 600;
}

.button-content:hover {
  background-color: #354a5f;
  color: #fff;
  cursor: pointer;
  transition: 0.3s;
}

p {
  margin: 0;
}
</style>
