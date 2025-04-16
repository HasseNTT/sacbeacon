import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

// Authentication configuration
const authConfig = {
  clientId: 'sb-00995cab-001e-4904-89fd-e51f5d74cf7c!b129954|client!b3650',
  clientSecret: '622d70df-40cd-4371-8809-70891893f225$piBiWfYi5xeJwBNS6EckeF9D3WtQxyTlWLiTanOZzzc=',
  tokenUrl: 'https://husqvarnagroup.authentication.eu10.hana.ondemand.com/oauth/token',
  apiBaseUrl:
    window.location.hostname === 'localhost'
      ? '/api/api/v1/dataexport'
      : 'https://husqvarnagroup.eu10.hcs.cloud.sap/api/v1/dataexport',
  factDataEndpoint: '/providers/sac/C2JLR5PJBXFFIA21Y6M72ZYSJK/FactData',
  costCenterEndpoint: '/providers/sac/C2JLR5PJBXFFIA21Y6M72ZYSJK/HUSQ_COSTCENTERMaster',
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const tokenExpiry = ref(null)

  // Computed properties (getters)
  const isAuthenticated = computed(() => !!token.value)
  const isTokenExpired = computed(() => {
    if (!tokenExpiry.value) return true
    return new Date() > tokenExpiry.value
  })

  // Actions
  const authenticate = async () => {
    // Return existing token if it's still valid
    if (token.value && !isTokenExpired.value) {
      return token.value
    }

    isLoading.value = true
    error.value = null

    try {
      const formData = new URLSearchParams()
      formData.append('grant_type', 'client_credentials')
      formData.append('client_id', authConfig.clientId)
      formData.append('client_secret', authConfig.clientSecret)

      const response = await axios.post(authConfig.tokenUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      console.log('Authentication successful')

      // Store the token
      token.value = response.data.access_token

      // Set token expiry (assuming token is valid for 1 hour)
      const expiryTime = new Date()
      expiryTime.setHours(expiryTime.getHours() + 1)
      tokenExpiry.value = expiryTime

      return token.value
    } catch (error) {
      console.error('Authentication error details:', error.response?.data || error.message)
      error.value = 'Authentication failed: ' + (error.message || 'Unknown error')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Function to fetch data from SAC API
  const fetchSacData = async (endpoint) => {
    isLoading.value = true
    error.value = null

    try {
      // Get a valid token first
      const accessToken = await authenticate()

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })

      return response.data
    } catch (error) {
      console.error('API Error details:', error.response?.status, error.response?.statusText)
      console.error('Error response data:', error.response?.data)
      error.value = error.message || 'Failed to fetch data'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const clearToken = () => {
    token.value = null
    tokenExpiry.value = null
  }

  // Return everything that should be available outside
  return {
    // State
    token,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    isTokenExpired,
    // Actions
    authenticate,
    fetchSacData,
    clearToken,
    // Config
    config: authConfig,
  }
})

export default authConfig
