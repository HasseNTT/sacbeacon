// stores/glBudgetStore.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'

export const useGlBudgetStore = defineStore('glBudgetData', () => {
  // State
  const glBudgetData = ref([])
  const accounts = ref([])
  const costCenterInfo = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Get the auth store
  const authStore = useAuthStore()

  // Fetch GL Budget data (similar to FTE data but with AMOUNT)
  const fetchGlBudgetData = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Get the auth configuration from the auth store
      const { config } = authStore

      const endpoint = `${config.apiBaseUrl}${config.factDataEndpoint}`

      // Filter for the data
      // Remove the cost center filter for production
      const filter =
        "Version eq 'public.APP GL Budget' " +
        "and HUSQ_PROFIT_CENTER eq '#' " +
        "and HUSQ_PARTNER_COST_CENTER eq '#' " +
        "and HUSQ_PARTNER_PROFIT_CENTER eq '#' " +
        "and HUSQ_COMPANY eq '1188' " +
        "and HUSQ_COST_TYPE eq 'ORIGINAL' " +
        "and HUSQ_SOURCE eq 'SGnA' " +
        "and HUSQ_COSTCENTER eq '1881110' "

      const select =
        'Version,HUSQ_ACCOUNT_GL_BU_SGA,Date,HUSQ_PROFIT_CENTER,HUSQ_PARTNER_COST_CENTER,' +
        'HUSQ_PARTNER_PROFIT_CENTER,HUSQ_COMPANY,HUSQ_DIVISION,HUSQ_FUNCAREA,HUSQ_COST_TYPE,' +
        'HUSQ_SOURCE,HUSQ_COSTCENTER,AMOUNT'

      const fullEndpoint = `${endpoint}?$filter=${encodeURIComponent(filter)}&$select=${encodeURIComponent(select)}`

      console.log('Calling endpoint:', fullEndpoint)

      // Use the auth store to fetch data
      const response = await authStore.fetchSacData(fullEndpoint)

      console.log('Response:', response)

      if (response && response.value) {
        glBudgetData.value = response.value
        console.log('First item sample:', response.value[0])
      } else {
        throw new Error('Invalid response format from GL Budget API')
      }
    } catch (err) {
      console.error('Error fetching GL Budget data:', err)
      error.value = err.message || 'Failed to fetch GL Budget data'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch account hierarchy
  const fetchAccounts = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { config } = authStore

      // Endpoint for the account dimension
      const endpoint = `${config.apiBaseUrl}/providers/sac/C2JLR5PJBXFFIA21Y6M72ZYSJK/HUSQ_ACCOUNT_GL_BU_SGAMaster`

      // Use the auth store to fetch data
      const response = await authStore.fetchSacData(endpoint)

      if (response && response.value) {
        accounts.value = response.value
      } else {
        throw new Error('Invalid response format from accounts API')
      }
    } catch (err) {
      console.error('Error fetching accounts:', err)
      error.value = err.message || 'Failed to fetch accounts'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch cost center info
  const fetchCostCenterInfo = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { config } = authStore

      // Endpoint for cost center dimension with filter for SG&A cost centers
      const filter = "Status eq 'Open' and Level_2 eq 'SG&A'"
      const endpoint = `${config.apiBaseUrl}/providers/sac/C2JLR5PJBXFFIA21Y6M72ZYSJK/HUSQ_COSTCENTERMaster?$filter=${encodeURIComponent(filter)}`

      // Use the auth store to fetch data
      const response = await authStore.fetchSacData(endpoint)

      if (response && response.value) {
        costCenterInfo.value = response.value
      } else {
        throw new Error('Invalid response format from cost center info API')
      }
    } catch (err) {
      console.error('Error fetching cost center info:', err)
      error.value = err.message || 'Failed to fetch cost center info'
    } finally {
      isLoading.value = false
    }
  }

  // Initialize data
  const initializeData = async () => {
    isLoading.value = true
    try {
      await Promise.all([fetchAccounts(), fetchGlBudgetData(), fetchCostCenterInfo()])
    } catch (err) {
      console.error('Error initializing data:', err)
      error.value = 'Failed to initialize data'
    } finally {
      isLoading.value = false
    }
  }

  const budgetData = computed(() => {
    // First, organize data by cost center
    const costCenterMap = {}

    // Process all data
    glBudgetData.value.forEach((item) => {
      const costCenter = item.HUSQ_COSTCENTER
      const account = item.HUSQ_ACCOUNT_GL_BU_SGA
      const dateStr = item.Date

      // Skip items without account or cost center
      if (!account || !costCenter) return

      // Skip NOT_IN_HIERARCHY entries
      if (account === 'NOT_IN_HIERARCHY') return

      // Get month and year
      let month, quarter, year
      if (dateStr && dateStr.length === 6) {
        year = dateStr.substring(0, 4)
        const monthNum = parseInt(dateStr.substring(4, 6), 10)
        month = monthNum - 1
        quarter = Math.ceil(monthNum / 3)
      } else if (dateStr && dateStr.includes('-')) {
        const dateObj = new Date(dateStr)
        month = dateObj.getMonth()
        quarter = Math.ceil((month + 1) / 3)
        year = dateObj.getFullYear()
      } else {
        return // Skip invalid dates
      }

      // Skip non-2025 data
      if (year !== '2025' && year !== 2025) {
        return
      }

      // Get month name
      const monthName = getMonthName(month)
      if (!monthName) return

      // Initialize cost center if not exists
      if (!costCenterMap[costCenter]) {
        costCenterMap[costCenter] = {
          accounts: {},
        }
      }

      // Initialize account if not exists
      if (!costCenterMap[costCenter].accounts[account]) {
        costCenterMap[costCenter].accounts[account] = {
          total2025: 0,
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
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

      // Add the amount to the appropriate month and quarter
      const amount = parseFloat(item.AMOUNT || 0)
      costCenterMap[costCenter].accounts[account][monthName.toLowerCase()] += amount
      costCenterMap[costCenter].accounts[account][`q${quarter}`] += amount
      costCenterMap[costCenter].accounts[account].total2025 += amount
    })

    // Create a lookup for account descriptions
    const accountInfo = {}
    accounts.value.forEach((acc) => {
      accountInfo[acc.ID] = {
        description: acc.Description || acc.ID,
        parent: acc.BU_ACCOUNT || '',
      }
    })

    // Now build the tree data structure
    const result = []

    // Process each cost center
    Object.keys(costCenterMap).forEach((cc) => {
      // Get cost center description from costCenterInfo
      const ccDescription =
        costCenterInfo.value.find((c) => c.ID === cc)?.Description || `Cost Center ${cc}`

      // Create cost center node
      const ccNode = {
        id: `cc_${cc}`,
        costCenter: cc,
        account: `Cost Center ${cc}`,
        description: ccDescription,
        total2025: 0,
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
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

      // Add BU_ACCOUNT_TOTAL node
      const buTotalNode = {
        id: `${cc}_BU_ACCOUNT_TOTAL`,
        parentId: `cc_${cc}`,
        costCenter: cc,
        account: 'BU_ACCOUNT_TOTAL',
        description: 'Budget accounts total',
        total2025: 0,
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
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

      // Organize accounts by their type
      const buAccounts = {} // BU accounts (like 7310BU)
      const childAccounts = {} // Individual accounts with BU parents
      const directAccounts = {} // Individual accounts without BU parents

      // First pass: identify account types
      Object.keys(costCenterMap[cc].accounts).forEach((account) => {
        if (account.endsWith('BU')) {
          // Store BU account data
          buAccounts[account] = {
            ...costCenterMap[cc].accounts[account],
            children: [],
          }
        } else {
          // Get parent account
          const parent = accountInfo[account]?.parent || ''

          if (parent && parent.endsWith('BU')) {
            // This is a child account
            if (!childAccounts[parent]) {
              childAccounts[parent] = []
            }
            childAccounts[parent].push({
              account,
              ...costCenterMap[cc].accounts[account],
            })
          } else {
            // This is a direct account (no BU parent)
            directAccounts[account] = costCenterMap[cc].accounts[account]
          }
        }
      })

      // Second pass: process BU accounts with their children
      Object.keys(buAccounts).forEach((buAccount) => {
        // Create BU account node with its own data
        const buNode = {
          id: `${cc}_${buAccount}`,
          parentId: `${cc}_BU_ACCOUNT_TOTAL`,
          costCenter: cc,
          account: buAccount,
          description: accountInfo[buAccount]?.description || buAccount,
          // Start with the direct values from this BU account
          total2025: buAccounts[buAccount].total2025,
          q1: buAccounts[buAccount].q1,
          q2: buAccounts[buAccount].q2,
          q3: buAccounts[buAccount].q3,
          q4: buAccounts[buAccount].q4,
          jan: buAccounts[buAccount].jan,
          feb: buAccounts[buAccount].feb,
          mar: buAccounts[buAccount].mar,
          apr: buAccounts[buAccount].apr,
          may: buAccounts[buAccount].may,
          jun: buAccounts[buAccount].jun,
          jul: buAccounts[buAccount].jul,
          aug: buAccounts[buAccount].aug,
          sep: buAccounts[buAccount].sep,
          oct: buAccounts[buAccount].oct,
          nov: buAccounts[buAccount].nov,
          dec: buAccounts[buAccount].dec,
        }

        // Add child accounts and sum up their values
        if (childAccounts[buAccount]) {
          childAccounts[buAccount].forEach((childAccount) => {
            const childNode = {
              id: `${cc}_${buAccount}_${childAccount.account}`,
              parentId: `${cc}_${buAccount}`,
              costCenter: cc,
              account: childAccount.account,
              description: accountInfo[childAccount.account]?.description || childAccount.account,
              total2025: childAccount.total2025,
              q1: childAccount.q1,
              q2: childAccount.q2,
              q3: childAccount.q3,
              q4: childAccount.q4,
              jan: childAccount.jan,
              feb: childAccount.feb,
              mar: childAccount.mar,
              apr: childAccount.apr,
              may: childAccount.may,
              jun: childAccount.jun,
              jul: childAccount.jul,
              aug: childAccount.aug,
              sep: childAccount.sep,
              oct: childAccount.oct,
              nov: childAccount.nov,
              dec: childAccount.dec,
            }

            // Add the child node to result
            result.push(childNode)

            // Add child values to BU account totals (important for aggregation)
            buNode.total2025 += childAccount.total2025
            buNode.q1 += childAccount.q1
            buNode.q2 += childAccount.q2
            buNode.q3 += childAccount.q3
            buNode.q4 += childAccount.q4
            buNode.jan += childAccount.jan
            buNode.feb += childAccount.feb
            buNode.mar += childAccount.mar
            buNode.apr += childAccount.apr
            buNode.may += childAccount.may
            buNode.jun += childAccount.jun
            buNode.jul += childAccount.jul
            buNode.aug += childAccount.aug
            buNode.sep += childAccount.sep
            buNode.oct += childAccount.oct
            buNode.nov += childAccount.nov
            buNode.dec += childAccount.dec
          })
        }

        // Add BU node to result
        result.push(buNode)

        // Add BU values to BU_ACCOUNT_TOTAL totals
        buTotalNode.total2025 += buNode.total2025
        buTotalNode.q1 += buNode.q1
        buTotalNode.q2 += buNode.q2
        buTotalNode.q3 += buNode.q3
        buTotalNode.q4 += buNode.q4
        buTotalNode.jan += buNode.jan
        buTotalNode.feb += buNode.feb
        buTotalNode.mar += buNode.mar
        buTotalNode.apr += buNode.apr
        buTotalNode.may += buNode.may
        buTotalNode.jun += buNode.jun
        buTotalNode.jul += buNode.jul
        buTotalNode.aug += buNode.aug
        buTotalNode.sep += buNode.sep
        buTotalNode.oct += buNode.oct
        buTotalNode.nov += buNode.nov
        buTotalNode.dec += buNode.dec
      })

      // Third pass: add direct accounts (no BU parent)
      Object.keys(directAccounts).forEach((account) => {
        // Skip if it's a NOT_IN_HIERARCHY account
        if (account === 'NOT_IN_HIERARCHY') return

        // Skip accounts with zero values
        const hasValue = directAccounts[account].total2025 !== 0
        if (!hasValue) return

        const directNode = {
          id: `${cc}_direct_${account}`,
          parentId: `${cc}_BU_ACCOUNT_TOTAL`,
          costCenter: cc,
          account: account,
          description: accountInfo[account]?.description || account,
          total2025: directAccounts[account].total2025,
          q1: directAccounts[account].q1,
          q2: directAccounts[account].q2,
          q3: directAccounts[account].q3,
          q4: directAccounts[account].q4,
          jan: directAccounts[account].jan,
          feb: directAccounts[account].feb,
          mar: directAccounts[account].mar,
          apr: directAccounts[account].apr,
          may: directAccounts[account].may,
          jun: directAccounts[account].jun,
          jul: directAccounts[account].jul,
          aug: directAccounts[account].aug,
          sep: directAccounts[account].sep,
          oct: directAccounts[account].oct,
          nov: directAccounts[account].nov,
          dec: directAccounts[account].dec,
        }

        // Add to result
        result.push(directNode)

        // Add to BU_ACCOUNT_TOTAL totals
        buTotalNode.total2025 += directNode.total2025
        buTotalNode.q1 += directNode.q1
        buTotalNode.q2 += directNode.q2
        buTotalNode.q3 += directNode.q3
        buTotalNode.q4 += directNode.q4
        buTotalNode.jan += directNode.jan
        buTotalNode.feb += directNode.feb
        buTotalNode.mar += directNode.mar
        buTotalNode.apr += directNode.apr
        buTotalNode.may += directNode.may
        buTotalNode.jun += directNode.jun
        buTotalNode.jul += directNode.jul
        buTotalNode.aug += directNode.aug
        buTotalNode.sep += directNode.sep
        buTotalNode.oct += directNode.oct
        buTotalNode.nov += directNode.nov
        buTotalNode.dec += directNode.dec
      })

      // Only add BU_ACCOUNT_TOTAL and cost center if they have values
      if (buTotalNode.total2025 !== 0) {
        // Add BU_ACCOUNT_TOTAL to result
        result.push(buTotalNode)

        // Copy BU_ACCOUNT_TOTAL values to cost center
        ccNode.total2025 = buTotalNode.total2025
        ccNode.q1 = buTotalNode.q1
        ccNode.q2 = buTotalNode.q2
        ccNode.q3 = buTotalNode.q3
        ccNode.q4 = buTotalNode.q4
        ccNode.jan = buTotalNode.jan
        ccNode.feb = buTotalNode.feb
        ccNode.mar = buTotalNode.mar
        ccNode.apr = buTotalNode.apr
        ccNode.may = buTotalNode.may
        ccNode.jun = buTotalNode.jun
        ccNode.jul = buTotalNode.jul
        ccNode.aug = buTotalNode.aug
        ccNode.sep = buTotalNode.sep
        ccNode.oct = buTotalNode.oct
        ccNode.nov = buTotalNode.nov
        ccNode.dec = buTotalNode.dec

        // Add cost center to result
        result.push(ccNode)
      }
    })

    console.log('Processed rows:', result.length)
    return result
  })

  // Helper function to get month name
  const getMonthName = (monthIndex) => {
    if (monthIndex < 0 || monthIndex > 11) {
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
    glBudgetData,
    accounts,
    costCenterInfo,
    isLoading,
    error,
    fetchGlBudgetData,
    fetchAccounts,
    fetchCostCenterInfo,
    initializeData,
    budgetData,
  }
})
