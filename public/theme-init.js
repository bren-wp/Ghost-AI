// Ghost AI by Brendigo
// Apply the only supported theme before first paint, independently of saved OS preferences.
;(function () {
  document.documentElement.classList.add('dark')
  document.documentElement.style.colorScheme = 'dark'
  try { localStorage.setItem('ghost_ai_theme', 'dark') } catch (_error) { /* best effort */ }
})()
