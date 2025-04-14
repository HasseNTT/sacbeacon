<template>
  <header>
    <div class="header-container">
      <div class="header-info-container">
        <h1>SG&A - Cost Center Budget 2025</h1>
        <p>FTE per Cost Center</p>
      </div>
      <div class="buttons-container">
        <HeaderButton text="Revert Data" :icon="RevertIcon" @click="handleRevert" />
        <HeaderButton text="Publish Data" :icon="PublishIcon" @click="handlePublish" />
      </div>
    </div>
    <nav>
      <ul class="tabs">
        <li>
          <router-link to="/fte" class="tab-link">FTE</router-link>
        </li>
        <li>
          <router-link to="/budget" class="tab-link">GL Budget</router-link>
        </li>
        <li>
          <router-link to="/division" class="tab-link">Division Split</router-link>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup>
import { inject, provide } from 'vue'
import { useFteStore } from '@/stores/fteStore'
import HeaderButton from './HeaderButton.vue'
import PublishIcon from '../icons/PublishIcon.vue'
import RevertIcon from '../icons/RevertIcon.vue'

// Get the store instance
const fteStore = useFteStore()

// Inject the resetEditedCells function if it exists
// This will be provided by the FTE table component
let resetEditedCells = inject('resetEditedCells', null)

const handlePublish = () => {
  // Handle publish button click
  console.log('Publishing data')
}

const handleRevert = async () => {
  try {
    // Show loading state
    fteStore.isLoading = true

    // Refresh data from API
    await fteStore.initializeData()

    // Reset edited cells tracking if the function is available
    if (resetEditedCells) {
      resetEditedCells()
    }
  } catch (error) {
    console.error('Error reverting data:', error)
  } finally {
    // Hide loading state
    fteStore.isLoading = false
  }
}
</script>

<style scoped>
/*--- CONTAINERS ---*/
.header-container {
  background-color: #c9d9e8;
  display: flex;
  gap: 20px;
  padding: 10px 20px;
  align-items: center;
}

.header-info-container {
  color: #354a5f;
  flex-grow: 1;
}

.buttons-container {
  display: flex;
  margin-left: auto;
  gap: 10px;
}

/*--- NAVBAR ---*/
nav {
  background-color: #fff;
}

.tabs {
  display: flex;
  list-style-type: none;
  padding: 0 20px;
  margin: 0;
  gap: 10px;
}

.tabs li {
  margin: 0;
}

.tab-link {
  display: inline-block;
  padding: 10px 15px;
  text-decoration: none;
  color: #c9d9e8;
  font-weight: 500;
  position: relative;
  transition: color 0.3s ease;
}

.tab-link:hover {
  color: #354a5f;
}

.router-link-active {
  color: #354a5f;
  font-weight: 600;
}

.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #354a5f;
}

/*--- FONT STYLING ---*/
h1 {
  font-size: 20px;
  font-weight: 700;
}

p {
  font-size: 13px;
  font-weight: 600;
}
</style>
