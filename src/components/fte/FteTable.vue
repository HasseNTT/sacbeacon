<template>
  <div class="container">
    <p>Cost Center:</p>
    <select v-model="selectedCostCenter" class="cost-center-dropdown">
      <option value="">All Cost Centers</option>
      <option v-for="cc in openCostCenters" :key="cc.ID" :value="cc.ID">
        {{ cc.ID }} - {{ cc.Description }}
      </option>
    </select>

    <div v-if="isLoading" class="loading">Loading data...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>

  <!-- AG GRID -->
  <div class="ag-grid-container">
    <ag-grid-vue
      :rowData="filteredRowData"
      :columnDefs="colDefs"
      :defaultColDef="defaultColDef"
      :modules="modules"
      @cell-value-changed="onCellValueChanged"
      style="height: 500px"
    >
    </ag-grid-vue>
  </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue3'
import { ref, computed, onMounted, provide } from 'vue'
import { ModuleRegistry, ClientSideRowModelModule, AllCommunityModule } from 'ag-grid-community'
import { useFteStore } from '@/stores/fteStore'
import { useFteTable } from '@/composables/useFteTable'

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule])

export default {
  name: 'FteTable',
  components: {
    AgGridVue,
  },
  setup() {
    const fteStore = useFteStore()
    const selectedCostCenter = ref('')
    const year = ref(2025)

    // Use the composable to get grid-related functionality
    const { colDefs, filteredRowData, defaultColDef, onCellValueChanged, resetEditedCells } =
      useFteTable(fteStore, selectedCostCenter, year)

    // Provide the resetEditedCells function to be accessible by the header component
    provide('resetEditedCells', resetEditedCells)

    // Get all open cost centers from the store
    const openCostCenters = computed(() => fteStore.openCostCenters)

    // Get loading state from store
    const isLoading = computed(() => fteStore.isLoading)

    // Get error state from store
    const error = computed(() => fteStore.error)

    onMounted(async () => {
      await fteStore.initializeData()
    })

    return {
      filteredRowData,
      colDefs,
      defaultColDef,
      selectedCostCenter,
      openCostCenters,
      isLoading,
      error,
      year,
      onCellValueChanged,
      resetEditedCells,
    }
  },
  data() {
    return {
      modules: [ClientSideRowModelModule],
    }
  },
}
</script>

<style scoped>
.container {
  padding: 5px 20px;
}

.ag-grid-container {
  padding: 5px 20px;
}

.cost-center-dropdown {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  min-width: 300px;
  margin-bottom: 10px;
}

.loading {
  margin: 10px 0;
  font-style: italic;
  color: #666;
}

.error {
  margin: 10px 0;
  color: red;
  font-weight: bold;
}

:deep(.total-column) {
  background-color: rgba(33, 150, 243, 0.1);
  font-weight: bold;
  text-align: right;
}

:deep(.values-column) {
  background-color: rgba(33, 150, 243, 0.08);
}

:deep(.edited-cell) {
  background-color: #fdf1cc !important;
}
</style>
