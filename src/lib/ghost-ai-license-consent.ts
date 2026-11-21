// Ghost AI by Brendigo
export const LICENSE_ACCEPTANCE_KEY = 'ghost_ai_terms_accepted_v1'

export function hasAcceptedLicense(): boolean {
  try {
    return localStorage.getItem(LICENSE_ACCEPTANCE_KEY) === 'accepted'
  } catch {
    return false
  }
}

export function acceptLicense(): boolean {
  try {
    localStorage.setItem(LICENSE_ACCEPTANCE_KEY, 'accepted')
    return true
  } catch {
    return false
  }
}
