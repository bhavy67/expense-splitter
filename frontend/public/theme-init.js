// Anti-flicker: apply the dark class before first paint. Kept as a file
// (not inline) so the CSP can stay script-src 'self'.
try {
  var t = localStorage.getItem('splititt-theme');
  var d = (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) || t === 'dark';
  if (d) document.documentElement.classList.add('dark');
} catch {}
