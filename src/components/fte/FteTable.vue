<template>
  <div class="container">
    <div class="cost-center-selector">
      <p>Cost Center:</p>

      <!-- Hierarchical Selector Component -->
      <HierarchicalSelector
        v-model="selectedCostCenters"
        :options="hierarchicalCostCenters"
        :all-items="allCostCenterItems"
        placeholder="Select cost centers..."
        searchPlaceholder="Search cost centers..."
        class="selector-control"
      />

      <!-- Selected items badges -->
      <div v-if="selectedCostCenters.length > 0" class="selected-badges">
        <span class="badge-count">{{ selectedCostCenters.length }} selected</span>
        <button class="clear-selection" @click="clearSelection">Clear</button>
      </div>
    </div>

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
      @grid-ready="onGridReady"
      style="height: 700px"
    >
    </ag-grid-vue>
  </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue3'
import { ref, computed, onMounted, provide, watch } from 'vue'
import { ModuleRegistry, ClientSideRowModelModule, AllCommunityModule } from 'ag-grid-community'
import { useFteStore } from '@/stores/fteStore'
import { useFteTable } from '@/composables/useFteTable'
import { useCostCenterHierarchy } from '@/composables/useCostCenterHierarchy'
import HierarchicalSelector from '@/components/fte/HierarchicalSelector.vue'

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule])

export default {
  name: 'FteTable',
  components: {
    AgGridVue,
    HierarchicalSelector,
  },
  setup() {
    const fteStore = useFteStore()
    const selectedCostCenters = ref([])
    const singleSelectedCostCenter = ref('') // For backwards compatibility
    const year = ref(2025)
    const gridApi = ref(null)

    // Use the cost center hierarchy composable
    const { hierarchicalCostCenters, allCostCenterItems, filterRowData } =
      useCostCenterHierarchy(fteStore)

    // Use the composable to get grid-related functionality
    const {
      colDefs,
      processedRowData,
      defaultColDef,
      onCellValueChanged,
      resetEditedCells,
      onGridReady: gridReadyHandler,
    } = useFteTable(fteStore, singleSelectedCostCenter, year)

    // Update singleSelectedCostCenter when the selection changes
    watch(selectedCostCenters, (newVal) => {
      // Filter to only include cost center IDs (not hierarchy node IDs)
      const costCenterIds = newVal.filter(
        (id) => !id.startsWith('level1_') && !id.startsWith('level2_') && !id.startsWith('level3_'),
      )

      if (costCenterIds.length === 1) {
        singleSelectedCostCenter.value = costCenterIds[0]
      } else {
        singleSelectedCostCenter.value = ''
      }
    })

    // Filter row data based on selected cost centers
    const filteredRowData = computed(() => {
      return filterRowData(processedRowData.value, selectedCostCenters.value)
    })

    // Clear cost center selection
    const clearSelection = () => {
      selectedCostCenters.value = []
    }

    // Handle grid ready
    const onGridReady = (params) => {
      gridApi.value = params.api
      if (gridReadyHandler) {
        gridReadyHandler(params)
      }
    }

    // Provide the resetEditedCells function to be accessible by the header component
    provide('resetEditedCells', resetEditedCells)
    provide('getGridApi', () => gridApi.value)

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
      selectedCostCenters,
      hierarchicalCostCenters,
      allCostCenterItems,
      isLoading,
      error,
      year,
      onCellValueChanged,
      resetEditedCells,
      onGridReady,
      clearSelection,
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

.cost-center-selector {
  margin-bottom: 16px;
}

.selector-control {
  width: 100%;
  max-width: 500px;
}

.ag-grid-container {
  padding: 5px 20px;
}

.selected-badges {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.badge-count {
  background-color: #e7f3fd;
  color: #197bbd;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  margin-right: 8px;
}

.clear-selection {
  background: none;
  border: none;
  color: #2c3e50;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
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
