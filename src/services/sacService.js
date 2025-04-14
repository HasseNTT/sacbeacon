import axios from 'axios'

export default {
  async authenticate(clientId, clientSecret, tokenUrl) {
    const formData = new URLSearchParams()
    formData.append('grant_type', 'client_credentials')
    formData.append('client_id', clientId)
    formData.append('client_secret', clientSecret)

    try {
      const response = await axios.post(tokenUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      console.log('Authentication successful')
      return response.data.access_token
    } catch (error) {
      console.error('Authentication error details:', error.response?.data || error.message)
      throw error
    }
  },

  async fetchSacData(accessToken, endpoint) {
    try {
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
      throw error
    }
  },
}
