import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'

export const useFteStore = defineStore('fteData', () => {
  // State
  const fteData = ref([])
  const costCenters = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get the auth store
  const authStore = useAuthStore()

  // Actions
  const fetchFteData = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Get the auth configuration from the auth store
      const { config } = authStore

      const endpoint = `${config.apiBaseUrl}${config.factDataEndpoint}`
      const filter =
        "Version eq 'public.APP GL Budget' " +
        "and HUSQ_ACCOUNT_GL_BU_SGA eq 'NOT_IN_HIERARCHY' " +
        "and HUSQ_PROFIT_CENTER eq '#' " +
        "and HUSQ_PARTNER_COST_CENTER eq '#' " +
        "and HUSQ_PARTNER_PROFIT_CENTER eq '#' " +
        "and HUSQ_COMPANY eq '1188' " +
        "and HUSQ_COST_TYPE eq 'ORIGINAL' " +
        "and HUSQ_SOURCE eq 'SGnA'"

      const select =
        'Version,HUSQ_ACCOUNT_GL_BU_SGA,Date,HUSQ_PROFIT_CENTER,HUSQ_PARTNER_COST_CENTER,' +
        'HUSQ_PARTNER_PROFIT_CENTER,HUSQ_COMPANY,HUSQ_DIVISION,HUSQ_FUNCAREA,HUSQ_COST_TYPE,' +
        'HUSQ_SOURCE,HUSQ_COSTCENTER,FTE'

      const fullEndpoint = `${endpoint}?$filter=${encodeURIComponent(filter)}&$select=${encodeURIComponent(select)}`

      // Use the auth store to fetch data
      const response = await authStore.fetchSacData(fullEndpoint)

      if (response && response.value) {
        if (response.value.length > 0) {
          // Count dates by month to see distribution
          const dateDistribution = {}
          response.value.forEach((item) => {
            if (!dateDistribution[item.Date]) {
              dateDistribution[item.Date] = 0
            }
            dateDistribution[item.Date]++
          })
        }

        fteData.value = response.value
      } else {
        throw new Error('Invalid response format from FTE data API')
      }
    } catch (err) {
      console.error('Error fetching FTE data:', err)
      error.value = err.message || 'Failed to fetch FTE data'
    } finally {
      isLoading.value = false
    }
  }

  const fetchCostCenters = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Get the auth configuration from the auth store
      const { config } = authStore

      // Use filter to get only open cost centers
      const filter = "Status eq 'Open' and Level_2 eq 'SG&A'"
      const endpoint = `${config.apiBaseUrl}${config.costCenterEndpoint}?$filter=${encodeURIComponent(filter)}`

      // Use the auth store to fetch data
      const response = await authStore.fetchSacData(endpoint)

      if (response && response.value) {
        costCenters.value = response.value
      } else {
        throw new Error('Invalid response format from cost center API')
      }
    } catch (err) {
      console.error('Error fetching cost centers:', err)
      error.value = err.message || 'Failed to fetch cost centers'
    } finally {
      isLoading.value = false
    }
  }

  // Initialize data
  const initializeData = async () => {
    isLoading.value = true
    try {
      await Promise.all([fetchCostCenters(), fetchFteData()])
    } catch (err) {
      console.error('Error initializing data:', err)
      error.value = 'Failed to initialize data'
    } finally {
      isLoading.value = false
    }
  }

  // Getters
  const openCostCenters = computed(() => costCenters.value)

  const fteDataByCostCenter = computed(() => {
    const result = {}

    // Debug counters
    let totalRecords = 0
    let skippedRecords = 0
    let processedByMonth = {
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
      aug: 0,
      sep: 0,
      oct: 0,
      nov: 0,
      dec: 0,
    }

    fteData.value.forEach((item) => {
      totalRecords++
      const costCenter = item.HUSQ_COSTCENTER
      const dateStr = item.Date
      let month
      let year

      // Handle different date formats with detailed logging
      if (dateStr && dateStr.length === 6) {
        // Format like "202501"
        year = dateStr.substring(0, 4)
        const monthStr = dateStr.substring(4, 6)
        month = parseInt(monthStr, 10) - 1 // Convert to 0-based index (0-11)
      } else if (dateStr && dateStr.includes('-')) {
        // Format like "2025-01-01"
        const dateObj = new Date(dateStr)
        month = dateObj.getMonth()
        year = dateObj.getFullYear()
      } else {
        console.warn('Unrecognized date format:', dateStr)
        skippedRecords++
        return // Skip this item
      }

      // Only process records for the current year (2025)
      if (year !== '2025' && year !== 2025) {
        skippedRecords++
        return
      }

      const monthName = getMonthName(month)
      if (!monthName) {
        console.warn(`Invalid month index: ${month} from date ${dateStr}`)
        skippedRecords++
        return
      }

      // Track which months are being processed
      processedByMonth[monthName.toLowerCase()]++

      if (!result[costCenter]) {
        // Find the cost center description
        const ccObj = costCenters.value.find((cc) => cc.ID === costCenter)
        const description = ccObj ? ccObj.Description : 'Unknown'

        result[costCenter] = {
          costcenter: costCenter,
          desc: description,
          // Initialize all months to 0
          jan: 0,
          feb: 0,
          mar: 0,
          apr: 0,
          may: 0,
          jun: 0,
          jul: 0,
          aug: 0,
          sep: 0,
          oct: 0,
          nov: 0,
          dec: 0,
        }
      }

      // Update the specific month with FTE value
      const monthKey = monthName.toLowerCase()
      const fteValue = parseFloat(item.FTE || 0)
      result[costCenter][monthKey] = fteValue
    })

    return Object.values(result)
  })

  // Helper function to get month name
  const getMonthName = (monthIndex) => {
    if (monthIndex < 0 || monthIndex > 11) {
      console.warn('Invalid month index:', monthIndex)
      return null
    }

    const months = [
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
    return months[monthIndex]
  }

  return {
    fteData,
    costCenters,
    isLoading,
    error,
    fetchFteData,
    fetchCostCenters,
    initializeData,
    openCostCenters,
    fteDataByCostCenter,
  }
})
