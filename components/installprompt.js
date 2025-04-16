/*!
 * pwa-install-prompt
 * Copyright (c) 2024 ryxxn
 * Released under the MIT License
 * https://github.com/ryxxn/pwa-install-prompt
 */


// constants

/**
 * !You can modify this part to change the language!
 */
const TEXT = {
  // common text
  TITLE: 'تثبيت التطبيق', // Install as an app
  WAITING: 'جاري تحميل بيانات التطبيق...', // Loading app info...
  SKIP_BUTTON: "المتابعة لعرض الموقع دون تبيثت التطبيق.", // I'm fine, I'll just view it on my mobile.
  INSTALL_BUTTON: 'تثبيت التطبيق', // Install as an app
  // IOS device specific text
  IOS: {
    TITLE: 'التثبيت على هواتف أيفون', // IOS App Installation Method
    INSTALL_STEPS: {
      STEP_1_1: 'أنقر على الأيقونة', // Click the icon
      STEP_1_2: 'في شريط المتصفح.', // in the browser address bar.
      STEP_2: "واضغط على خيار 'Add to Home Screen'.", // Click 'Add to Home Screen'.
    }
  },
}

const MODAL_STYLE = `
  .wepp-modal-overlay * { box-sizing: border-box; }
  .wepp-modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, .5); justify-content: center; align-items: center; z-index: 99999; }
  .wepp-modal-content { min-width: 340px; max-width:340px; background: #fff; border-radius: 10px; position: relative; }
  .wepp-modal-content h1 { font-size: 18px; }
  .wepp-modal-body { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  #wepp-logo { border-radius: 8px; }
  #wepp-install-button { width: 100%; background: #007bff; color: #fff; border: none; border-radius: 5px; font-size: 18px; cursor: pointer; font-weight: 700; transition: .3s; }
  #wepp-install-button:hover { background: #0056b3; }
  #wepp-install-button:active { transform: scale(.98); }
  #wepp-install-button:disabled { opacity:0.7; cursor: not-allowed; }
  #wepp-skip-button { all: initial; font:inherit; width: 100%; text-align: center; cursor: pointer; color: #a0a0a0; font-size: 14px; text-decoration: underline; }
`;
const IOS_MODAL_CONTENT = `
      <div class="wepp-modal-content" style="padding: 20px;">
        <div class="wepp-modal-body">
          <h1 style="margin-top: 0; margin-bottom: 10px;">${TEXT.IOS.TITLE}</h1>
          <img id="wepp-logo" alt="logo" width="64" height="64" />
          <h2 id="wepp-name"></h2>
        </div>
        <ol style="margin-block:4px;padding:0;margin-left:20px;">
          <li>
            ${TEXT.IOS.INSTALL_STEPS.STEP_1_1}
            <span style="vertical-align:middle;">
              <svg
                version="1.1"
                viewBox="0 0 2048 2048"
                width="24"
                height="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  transform="translate(600,655)"
                  d="m0 0h301l1 2v79l-1 1-284 1-17 2-10 5-6 5-6 10-3 11v751l3 12 7 10 8 6 8 3 12 2h776l54-1 12-4 9-7 6-10 3-14v-744l-2-12-5-10-5-6-14-7-4-1-18-1-278-1-1-1v-81h301l18 3 16 5 16 8 12 8 12 10v2l3 1 9 11 9 14 8 17 4 14 2 12 1 15v744l-2 21-6 21-9 19-10 14-12 13-10 8-11 7-14 7-18 6-17 3-13 1h-824l-20-2-19-5-16-7-12-7-16-13-11-12-10-15-8-16-5-17-3-18-1-42v-658l1-61 3-18 5-16 4-9 7-13 8-11 3-4h2l2-4 13-12 16-10 15-7 18-5z"
                />
                <path
                  transform="translate(1023,229)"
                  d="m0 0 5 3 269 269 1 4-53 53-2 3-4-1-172-172-1 3v753l-2 3h-81l-1-2v-758l-174 174h-3l-7-8-48-48 1-5 10-9 162-162 5-6 7-6 5-6 7-6 5-6 7-6 5-6 7-6 5-6 7-6 5-6 7-6 5-6 8-7z"
                />
              </svg>
            </span>
            ${TEXT.IOS.INSTALL_STEPS.STEP_1_2}
          </li>
          <li>
            <p style="margin-block:4px;">${TEXT.IOS.INSTALL_STEPS.STEP_2}</p>
          </li>
        </ol>

        <button id="wepp-skip-button">${TEXT.SKIP_BUTTON}</button>
      </div>
    `;
const DEFAULT_MODAL_CONTENT = `
    <div class="wepp-modal-content" style="padding: 20px;">
      <div class="wepp-modal-body">
        <h1 style="margin-top: 0; margin-bottom: 10px;">${TEXT.TITLE}</h1>
        <img id="wepp-logo" alt="logo" width="64" height="64" />
        <h2 id="wepp-name"></h2>
      </div>
      <button id="wepp-install-button" style="margin-top: 10px;padding: 10px;" disabled>${TEXT.WAITING}</button>
      <button id="wepp-skip-button" style="margin-top: 20px">
        ${TEXT.SKIP_BUTTON}
      </button>
    </div>
  `

// functions

/**
 * Function that identifies the favicon as the default logo 
 * and gets the address
 */
function getFaviconHref() {
  const linkElements = document.getElementsByTagName('link');

  for (let i = 0; i < linkElements.length; i++) {
    if (linkElements[i].getAttribute('rel') === 'icon') {
      return linkElements[i].getAttribute('href');
    }
  }

  return '';
}

function appendStyles() {
  const style = document.createElement('style');
  style.textContent = MODAL_STYLE;

  document.head.appendChild(style);
}

/**
 * Create a Proxy object to detect whether PWA is installed
 */
function createProxy() {
  // 상태 객체
  let state = {
    isInstalled: true,
  };

  // Handlers for detecting state changes
  const handler = {
    set: function (target, property, value) {
      // console.log(
      //   `${property} changed from ${target[property]} to ${value}.`
      // );
      target[property] = value;
      // Additional actions after status change
      if (property === 'isInstalled') {
        if (value) {
          // console.log('PWA is already installed');
        } else {
          // console.log('PWA is not installed');
        }
      }
      return true;
    },
  };

  // Proxy
  const proxyState = new Proxy(state, handler);

  return proxyState;
}

const getModalContent = (isIOS) => {
  return isIOS ? IOS_MODAL_CONTENT : DEFAULT_MODAL_CONTENT;
};

function createContainer() {
  const container = document.createElement('div');
  container.id = 'wepp-install-modal';
  container.className = 'wepp-modal-overlay';
  document.body.appendChild(container);
  return container;
}

const handleHashChange = () => {
  const hash = window.location.hash;
  const isValidHash = hash.startsWith('#wepp-install-modal');

  const modal = document.getElementById('wepp-install-modal');
  modal.style.display = isValidHash ? 'flex' : 'none';
};

const initializePWAInfo = () => {
  const nameElement = document.getElementById('wepp-name');
  const logoElement = document.getElementById('wepp-logo');

  const name = document.title;
  const logo = getFaviconHref();

  nameElement.textContent = name;
  logoElement.src = logo;
}

function handleModalClose() {
  window.location.hash = '';
  const modal = document.getElementById('wepp-install-modal');
  modal.style.display = 'none';
}

function preventModalContentClick(event) {
  event.stopPropagation();
}

function initializeModalEvents() {
  const modal = document.getElementById('wepp-install-modal');
  const skipButton = document.getElementById('wepp-skip-button');
  const modalContent = modal.querySelector('.wepp-modal-content');

  // Close Modal on Background Click
  modal.addEventListener('click', handleModalClose);
  modalContent.addEventListener('click', preventModalContentClick);

  skipButton.addEventListener('click', handleModalClose);
}

const showPrompt = (deferredPrompt) => {
  try {
    deferredPrompt.prompt(); // Show the install prompt
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        // User accepted the install prompt
        handleModalClose();
      } else {
        // User dismissed the install prompt
      }
      // Clear the deferredPrompt variable
      deferredPrompt = null;
    });
  } catch (error) {
    console.log('Error: ', error);
  }
}

function main() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  appendStyles();

  // Create Modal containers and add them to dom
  const container = createContainer();
  container.innerHTML = getModalContent(isIOS);

  // initializeModal
  handleHashChange();

  initializePWAInfo();

  initializeModalEvents();

  // initialize hash change event
  window.addEventListener('hashchange', handleHashChange);

  // ----------------------------------------------------------
  const state = createProxy();

  if (!isIOS) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      const deferredPrompt = e;
      const installButton = document.getElementById('wepp-install-button');
      installButton.addEventListener('click', () => showPrompt(deferredPrompt), { once: true })
      installButton.innerText = TEXT.INSTALL_BUTTON;
      installButton.disabled = false;
      state.isInstalled = false;
    });
  }

  window.addEventListener('appinstalled', () => {
    state.isInstalled = true;
    console.log('PWA was installed');
  });
}

if (document.readyState === "loading") {
  // Loading hasn't finished yet
  document.addEventListener("DOMContentLoaded", main);
} else {
  // `DOMContentLoaded` has already fired
  main();
}
