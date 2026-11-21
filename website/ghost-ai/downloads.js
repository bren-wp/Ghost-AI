// Ghost AI by Brendigo
const statusElement = document.getElementById('download-status')
const links = [...document.querySelectorAll('[data-package]')]

const showStatus = (message) => {
  if (statusElement) statusElement.textContent = message
}

async function revealVerifiedPackages() {
  try {
    const response = await fetch('./downloads/files.json', {
      cache: 'no-store',
      credentials: 'omit',
    })
    if (!response.ok) throw new Error('Manifest not published')
    const manifest = await response.json()
    if (!Array.isArray(manifest.files)) throw new Error('Invalid manifest')
    const allowed = new Set(
      manifest.files
        .filter((file) => typeof file.name === 'string' &&
          /^Ghost-AI-v\d+\.\d+\.\d+-[A-Za-z0-9_.-]+$/.test(file.name) &&
          /^[a-f0-9]{64}$/i.test(file.sha256))
        .map((file) => file.name)
    )
    let available = 0
    for (const link of links) {
      const file = link.getAttribute('data-package')
      if (!file || !allowed.has(file)) continue
      link.href = './downloads/' + encodeURIComponent(file)
      link.hidden = false
      link.removeAttribute('aria-disabled')
      available += 1
    }
    showStatus(available === 0
      ? 'Verified downloads are not yet published. Please visit again after the release.'
      : 'Downloads are available from Brendigo. Always verify the published SHA-256 checksums.')
  } catch {
    showStatus('Verified downloads are not yet published. Please visit again after the release.')
  }
}

void revealVerifiedPackages()
