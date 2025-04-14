import { computed, ref, reactive } from 'vue'

export function useFteTable(fteStore, selectedCostCenter, year) {
  // Track edited cells - using reactive for better reactivity
  const editedCells = reactive({})

  // Add reference to grid API
  const gridApi = ref(null)

  // Helper function to format numbers with 2 decimal places
  const formatNumber = (value) => {
    return value !== undefined ? Number(value).toFixed(2) : '0.00'
  }

  // Handle cell value changed
  const onCellValueChanged = (params) => {
    const cellId = `${params.data.costcenter}_${params.colDef.field}`
    const field = params.colDef.field

    // Check if value is actually different from original
    const oldValue = Number(params.oldValue || 0)
    const newValue = Number(params.newValue || 0)

    if (oldValue !== newValue) {
      // Mark cell as edited
      editedCells[cellId] = true

      console.log(`Cell ${cellId} changed: ${oldValue} → ${newValue}`)

      // Sync total and December values
      if (field === 'total') {
        // If total was edited, update December
        params.data.dec = newValue
        const decId = `${params.data.costcenter}_dec`
        editedCells[decId] = true

        // Refresh December cell
        if (params.api && params.node) {
          params.api.refreshCells({
            rowNodes: [params.node],
            columns: ['dec'],
            force: true,
          })
        }
      } else if (field === 'dec') {
        // If December was edited, update total
        params.data.total = newValue
        const totalId = `${params.data.costcenter}_total`
        editedCells[totalId] = true

        // Refresh total cell
        if (params.api && params.node) {
          params.api.refreshCells({
            rowNodes: [params.node],
            columns: ['total'],
            force: true,
          })
        }
      }

      // Force cell refresh to apply the style immediately
      if (params.api && params.node) {
        params.api.refreshCells({
          rowNodes: [params.node],
          columns: [params.column.getId()],
          force: true,
        })
      }
    }
  }

  // Store grid API when grid is ready
  const onGridReady = (params) => {
    gridApi.value = params.api
  }

  // Generate dynamic column definitions
  const colDefs = computed(() => {
    // Base columns
    const baseCols = [
      {
        field: 'costcenter',
        headerName: 'Cost Center',
        filter: true,
        flex: 1,
        pinned: 'left',
      },
      {
        field: 'desc',
        headerName: 'Description',
        filter: true,
        flex: 2,
        pinned: 'left',
      },
      {
        field: 'total',
        headerName: `${year.value}`,
        type: 'numericColumn',
        width: 75,
        valueFormatter: (params) => formatNumber(params.value),
        cellClass: 'total-column',
        pinned: 'left',
        filter: false,
        editable: true,
        cellClassRules: {
          'edited-cell': (params) => {
            const cellId = `${params.data.costcenter}_${params.colDef.field}`
            return editedCells[cellId] === true
          },
        },
      },
    ]

    // Month columns
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    const monthCols = monthNames.map((name, index) => {
      const monthKey = [
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
      ][index]
      return {
        field: monthKey,
        headerName: `${name} (${year.value})`,
        editable: true,
        type: 'numericColumn',
        flex: 1,
        filter: false,
        cellClass: 'values-column',
        cellClassRules: {
          'edited-cell': (params) => {
            const cellId = `${params.data.costcenter}_${params.colDef.field}`
            return editedCells[cellId] === true
          },
        },
        valueFormatter: (params) => formatNumber(params.value),
      }
    })

    return [...baseCols, ...monthCols]
  })

  // Process row data to add the total column
  const processedRowData = computed(() => {
    return fteStore.fteDataByCostCenter.map((row) => {
      // Calculate the total as the December value (or sum of all months if needed)
      const total = row.dec || 0
      return {
        ...row,
        total: total,
        // Ensure all month values are numbers with correct formatting
        jan: Number(row.jan || 0),
        feb: Number(row.feb || 0),
        mar: Number(row.mar || 0),
        apr: Number(row.apr || 0),
        may: Number(row.may || 0),
        jun: Number(row.jun || 0),
        jul: Number(row.jul || 0),
        aug: Number(row.aug || 0),
        sep: Number(row.sep || 0),
        oct: Number(row.oct || 0),
        nov: Number(row.nov || 0),
        dec: Number(row.dec || 0),
      }
    })
  })

  // Reset all edited cells tracking
  const resetEditedCells = () => {
    // Clear all tracked edited cells
    Object.keys(editedCells).forEach((key) => {
      delete editedCells[key]
    })

    // Force refresh all cells to update styling
    if (gridApi.value) {
      gridApi.value.refreshCells({ force: true })
    }
  }

  return {
    colDefs,
    processedRowData,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
    },
    formatNumber,
    onCellValueChanged,
    onGridReady,
    resetEditedCells,
    editedCells,
    gridApi,
  }
}
