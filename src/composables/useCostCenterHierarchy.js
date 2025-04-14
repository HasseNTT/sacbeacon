import { computed, ref } from 'vue'

/**
 * Composable to convert cost center data into hierarchical structure
 *
 * @param {Object} fteStore - The FTE store instance
 * @returns {Object} Hierarchical data and helper functions
 */
export function useCostCenterHierarchy(fteStore) {
  // Flat array of all cost centers
  const allCostCenterItems = ref([])

  // Convert cost centers to hierarchical format
  const hierarchicalCostCenters = computed(() => {
    const result = []
    const level1Map = new Map()
    const level2Map = new Map()
    const level3Map = new Map()

    // Reset allCostCenterItems
    allCostCenterItems.value = []

    fteStore.openCostCenters
      .filter((cc) => cc.Source === 'SGnA')
      .forEach((cc) => {
        if (!cc.Level_1 || !cc.Level_2 || !cc.Level_3) return

        // Add to flat list of all cost centers
        allCostCenterItems.value.push({
          id: cc.ID,
          label: `${cc.ID} - ${cc.Description}`,
          metadata: {
            level1: cc.Level_1,
            level2: cc.Level_2,
            level3: cc.Level_3,
          },
        })

        // Level 1
        if (!level1Map.has(cc.Level_1)) {
          const level1Node = {
            id: `level1_${cc.Level_1}`,
            label: cc.Level_1,
            children: [],
          }
          level1Map.set(cc.Level_1, level1Node)
          result.push(level1Node)
        }

        // Level 2
        const level1Node = level1Map.get(cc.Level_1)
        const level2Key = `${cc.Level_1}_${cc.Level_2}`

        if (!level2Map.has(level2Key)) {
          const level2Node = {
            id: `level2_${level2Key}`,
            label: cc.Level_2,
            children: [],
          }
          level2Map.set(level2Key, level2Node)
          level1Node.children.push(level2Node)
        }

        // Level 3
        const level2Node = level2Map.get(level2Key)
        const level3Key = `${level2Key}_${cc.Level_3}`

        if (!level3Map.has(level3Key)) {
          const level3Node = {
            id: `level3_${level3Key}`,
            label: cc.Level_3,
            children: [],
          }
          level3Map.set(level3Key, level3Node)
          level2Node.children.push(level3Node)
        }

        // Add the actual cost center as a leaf node
        const level3Node = level3Map.get(level3Key)
        level3Node.children.push({
          id: cc.ID,
          label: `${cc.ID} - ${cc.Description}`,
        })
      })

    return result
  })

  /**
   * Filter row data based on selected cost centers
   *
   * @param {Array} rowData - The row data array
   * @param {Array} selectedCostCenters - Array of selected cost center IDs
   * @returns {Array} Filtered row data
   */
  const filterRowData = (rowData, selectedCostCenters) => {
    if (!selectedCostCenters || selectedCostCenters.length === 0) {
      return rowData
    }

    // Filter only actual cost center IDs (not hierarchy node IDs)
    const costCenterIds = selectedCostCenters.filter(
      (id) => !id.startsWith('level1_') && !id.startsWith('level2_') && !id.startsWith('level3_'),
    )

    if (costCenterIds.length === 0) {
      return rowData
    }

    return rowData.filter((row) => costCenterIds.includes(row.costcenter))
  }

  return {
    hierarchicalCostCenters,
    allCostCenterItems,
    filterRowData,
  }
}
