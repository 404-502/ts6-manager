// Apply persisted theme before React renders to prevent flash
try {
  var stored = JSON.parse(localStorage.getItem('ts6-ui') || '{}');
  var theme = (stored.state && stored.state.theme) || 'dark';
  if (theme === 'dark') document.documentElement.classList.add('dark');
} catch(e) { document.documentElement.classList.add('dark'); }
