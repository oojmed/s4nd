// import * as Settings from '/js/info/settings';
// import { showSnackbar } from '/js/ui/snackbar';

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 76 and later from showing the mini-infobar
  e.preventDefault();

  // Stash the event so it can be triggered later.
  deferredPrompt = e;

  // checkToShowInstallPrompt();
});

function checkToShowInstallPrompt() {
  if (Settings.installPrompts !== true) {
    return;
  }

  if (localStorage.getItem('asked') === null) { // First time
    localStorage.setItem('asked', Date.now());

    setTimeout(showInstallPrompt, 60000);
    return;
  }

  if (Date.now() - localStorage.getItem('asked') > 86400000) { // Only ask daily
    showInstallPrompt();
  }
}

export function showInstallPrompt() {
  localStorage.setItem('asked', Date.now());

  showSnackbar("install");
}