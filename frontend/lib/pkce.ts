function toBase64Url(bytes: Uint8Array) {
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function generateRandomString(byteLength = 32) {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

export async function generatePkcePair() {
  const verifier = generateRandomString(64)
  const encoded = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  const challenge = toBase64Url(new Uint8Array(digest))

  return {
    verifier,
    challenge,
  }
}

export function buildKakaoAuthorizeUrl({
  clientId,
  redirectUri,
  codeChallenge,
  state,
  nonce,
}: {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state: string
  nonce: string
}) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce,
    scope: 'openid profile_nickname',
  })

  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
}
