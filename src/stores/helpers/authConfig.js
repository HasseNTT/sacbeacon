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

export default authConfig
