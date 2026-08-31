export function initializeSharedTheme() {
  const savedTheme = window.localStorage.getItem('theme')
  const isDark = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', isDark)
}
