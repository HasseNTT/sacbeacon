<template>
  <div class="container">
    <h2>GL Budget View</h2>

    <div v-if="isLoading" class="loading">Loading data...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <!-- AG GRID -->
    <div class="ag-grid-container" v-if="!isLoading && !error">
      <ag-grid-vue
        style="height: 900px; width: 100%"
        :columnDefs="columnDefs"
        :rowData="rowData"
        :defaultColDef="defaultColDef"
        :treeData="true"
        :animateRows="true"
        :gridOptions="gridOptions"
        :getDataPath="getDataPath"
        @grid-ready="onGridReady"
      >
      </ag-grid-vue>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import { ModuleRegistry, ClientSideRowModelModule, AllCommunityModule } from 'ag-grid-community'
import { useGlBudgetStore } from '@/stores/glBudgetStore'
import { AllEnterpriseModule, LicenseManager } from 'ag-grid-enterprise'

// Register AG Grid Enterprise modules
ModuleRegistry.registerModules([AllEnterpriseModule, AllCommunityModule])

LicenseManager.setLicenseKey(
  '[TRIAL]_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-078795}_is_granted_for_evaluation_only___Use_in_production_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_purchasing_a_production_key_please_contact_info@ag-grid.com___You_are_granted_a_{Single_Application}_Developer_License_for_one_application_only___All_Front-End_JavaScript_developers_working_on_the_application_would_need_to_be_licensed___This_key_will_deactivate_on_{30 April 2025}____[v3]_[0102]_MTc0NTk2NzYwMDAwMA==39b1546fe2d969966a31bbc6b46371db',
)

export default {
  name: 'GlBudgetView',
  components: {
    AgGridVue,
  },
  setup() {
    const glBudgetStore = useGlBudgetStore()
    const gridApi = ref(null)
    const columnApi = ref(null)

    // Format currency values
    const formatCurrency = (params) => {
      if (params.value == null) return ''
      return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(params.value)
    }

    // Column definitions for AG Grid
    const columnDefs = ref([
      {
        field: 'costCenter',
        headerName: 'Cost Center',
        width: 120,
        cellRenderer: (params) => {
          // Only show cost center for top-level rows
          return params.node.level === 0 ? params.value : ''
        },
      },
      {
        field: 'description',
        headerName: 'Description',
        width: 220,
        cellRenderer: (params) => {
          // Only show description for top-level rows
          return params.node.level === 0 ? params.value : ''
        },
      },
      {
        field: 'account',
        headerName: 'Account',
        width: 280,
        rowGroup: true,
        hide: true,
      },
      {
        field: 'total2025',
        headerName: '2025',
        type: 'numericColumn',
        valueFormatter: formatCurrency,
        width: 120,
        cellClass: 'total-column',
      },
      {
        headerName: 'Quarters',
        marryChildren: true,
        children: [
          {
            field: 'q1',
            headerName: 'Q1',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 100,
            cellClass: 'quarter-column',
          },
          {
            field: 'q2',
            headerName: 'Q2',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 100,
            cellClass: 'quarter-column',
          },
          {
            field: 'q3',
            headerName: 'Q3',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 100,
            cellClass: 'quarter-column',
          },
          {
            field: 'q4',
            headerName: 'Q4',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 100,
            cellClass: 'quarter-column',
          },
        ],
      },

      // Monthly columns (initially hidden)
      {
        headerName: 'Months',
        marryChildren: true,
        children: [
          {
            field: 'jan',
            headerName: 'Jan',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'feb',
            headerName: 'Feb',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'mar',
            headerName: 'Mar',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'apr',
            headerName: 'Apr',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'may',
            headerName: 'May',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'jun',
            headerName: 'Jun',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'jul',
            headerName: 'Jul',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'aug',
            headerName: 'Aug',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'sep',
            headerName: 'Sep',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'oct',
            headerName: 'Oct',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'nov',
            headerName: 'Nov',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
          {
            field: 'dec',
            headerName: 'Dec',
            type: 'numericColumn',
            valueFormatter: formatCurrency,
            width: 90,
            cellClass: 'month-column',
            hide: true,
          },
        ],
      },
    ])

    // Default column definitions
    const defaultColDef = {
      flex: 1,
      sortable: true,
      filter: true,
      resizable: true,
    }

    // Grid options for tree data
    const gridOptions = {
      autoGroupColumnDef: {
        headerName: 'Account',
        minWidth: 280,
        cellRendererParams: {
          suppressCount: true,
          innerRenderer: (params) => {
            if (!params.data) return ''

            // Format display based on node type
            if (params.node.level === 0) {
              // Cost center - show description instead of "Cost Center ID"
              return params.data.description
            } else if (params.data.account === 'BU_ACCOUNT_TOTAL') {
              // BU_ACCOUNT_TOTAL node
              return params.data.account + ' ' + params.data.description
            } else if (params.data.account.endsWith('BU')) {
              // BU category account
              return params.data.account + ' ' + params.data.description
            } else {
              // Individual account
              return params.data.account + ' ' + params.data.description
            }
          },
        },
      },
      groupDefaultExpanded: 1,
      suppressAggFuncInHeader: true,
      // Customize the grid appearance
      rowHeight: 28,
      headerHeight: 32,
      // Add specific styling classes
      rowClass: (params) => {
        if (params.node.level === 0) return 'cost-center-row'
        if (params.data && params.data.account === 'BU_ACCOUNT_TOTAL') return 'total-row'
        return ''
      },
    }

    // Function to determine the data path for tree data
    const getDataPath = (data) => {
      if (!data.parentId) {
        // This is a cost center (top level)
        return [data.id]
      } else if (data.parentId.startsWith('cc_')) {
        // This is a direct child of cost center (BU_ACCOUNT_TOTAL)
        return [data.parentId, data.id]
      } else if (data.parentId.includes('_BU_ACCOUNT_TOTAL')) {
        // This is a BU account under BU_ACCOUNT_TOTAL
        const costCenterId = data.parentId.replace('_BU_ACCOUNT_TOTAL', '')
        return [`cc_${costCenterId}`, data.parentId, data.id]
      } else {
        // This is an individual account under a BU account
        const parentParts = data.parentId.split('_')
        const costCenterId = parentParts[0]
        return [`cc_${costCenterId}`, `${costCenterId}_BU_ACCOUNT_TOTAL`, data.parentId, data.id]
      }
    }

    // Grid API ready handler
    const onGridReady = (params) => {
      gridApi.value = params.api
      columnApi.value = params.columnApi

      // Auto-size columns to fit the grid
      params.api.sizeColumnsToFit()

      // Add toolbar button to toggle months/quarters
      addToggleButton()
    }

    // Toggle between quarters and months
    const toggleMonthsQuarters = () => {
      const monthColumns = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ]
      const quarterColumns = ['q1', 'q2', 'q3', 'q4']

      // Check if months are currently visible
      const areMonthsVisible = !columnApi.value.getColumn('jan').isVisible()

      // Toggle visibility
      monthColumns.forEach((col) => {
        columnApi.value.setColumnVisible(col, areMonthsVisible)
      })

      quarterColumns.forEach((col) => {
        columnApi.value.setColumnVisible(col, !areMonthsVisible)
      })

      // Update button text
      const button = document.getElementById('toggleButton')
      if (button) {
        button.textContent = areMonthsVisible ? 'Show Quarters' : 'Show Months'
      }
    }

    // Add a toggle button to the grid
    const addToggleButton = () => {
      const eButton = document.createElement('button')
      eButton.id = 'toggleButton'
      eButton.innerHTML = 'Show Months'
      eButton.className = 'toggle-button'
      eButton.addEventListener('click', toggleMonthsQuarters)

      const eDiv = document.querySelector('.ag-grid-container')
      if (eDiv) {
        eDiv.insertBefore(eButton, eDiv.firstChild)
      }
    }

    // Get data from store
    const rowData = computed(() => glBudgetStore.budgetData)
    const isLoading = computed(() => glBudgetStore.isLoading)
    const error = computed(() => glBudgetStore.error)

    // Load data when component mounts
    onMounted(async () => {
      await glBudgetStore.initializeData()
    })

    return {
      columnDefs,
      rowData,
      defaultColDef,
      gridOptions,
      getDataPath,
      onGridReady,
      isLoading,
      error,
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
  padding: 20px;
}

.ag-grid-container {
  height: 700px;
  width: 100%;
  margin-top: 20px;
}

.loading {
  margin: 20px;
  font-style: italic;
  color: #888;
}

.error {
  margin: 20px;
  color: red;
  font-weight: bold;
}

.toggle-button {
  margin-bottom: 10px;
  padding: 5px 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.toggle-button:hover {
  background-color: #45a049;
}

:deep(.cost-center-row) {
  background-color: rgba(240, 240, 240, 0.5);
  font-weight: bold;
}

:deep(.total-row) {
  font-weight: bold;
}

:deep(.total-column) {
  background-color: rgba(33, 150, 243, 0.2);
  font-weight: bold;
}

:deep(.quarter-column) {
  background-color: rgba(33, 150, 243, 0.1);
}

:deep(.month-column) {
  background-color: rgba(33, 150, 243, 0.05);
}
</style>
