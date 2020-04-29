
// check if this website is a google slides page

function isGoogleSlidesPresentation() {
  return window.location.host === "docs.google.com"
    && window.location.pathname.startsWith("/presentation")
    && getPresentationButton();
}

var slideTitlePrefix = '▹';
var slideTitleRegex = /▹(\d+)$/;

function setSlideTitle(slideNum) {
    var title = window.document.querySelector('.docs-title-input');
    var currentTitle = title.value;
    var nextTitle = currentTitle.match(slideTitleRegex)
          ? currentTitle.replace(slideTitleRegex, (j,a) => slideTitlePrefix + (slideNum))
          : currentTitle + slideTitlePrefix + slideNum;
    title.value = nextTitle;
    setTimeout(() => eventFire(title, "focus"), 0);
    setTimeout(() => eventFire(title, "blur"), 1);
}

function cleanupSlideTitle() {
    var title = window.document.querySelector('.docs-title-input');
    title.value = title.value.replace(slideTitleRegex, '')
    setTimeout(() => eventFire(title, "focus"), 0);
    setTimeout(() => eventFire(title, "blur"), 1);
}

function incrementTitle() {
    var title = document.querySelector('.docs-title-input');
    var currentTitle = title.value;
    var nextTitle = currentTitle.match(slideTitleRegex)
          ? currentTitle.replace(slideTitleRegex, (j,a) => slideTitlePrefix + (parseInt(a) + 1))
          : currentTitle + slideTitlePrefix + "1";
    title.value = nextTitle;
    setTimeout(() => eventFire(title, "focus"), 0);
    setTimeout(() => eventFire(title, "blur"), 1);
}

function getSlideNumberFromTitle() {
    var title = window.document.querySelector('.docs-title-input');
    var match = title.value.match(slideTitleRegex);
    if (match) {
        return match[1];
    }
    return undefined;
}




function eventFire(el, etype){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = window.document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

function mouseEventFire(el, etype, x, y){
  if (!x || !y) {
    var bounds = el.getBoundingClientRect();
    x = bounds.left + bounds.width / 2;
    y = bounds.top + bounds.height / 2;
  }
  //var ev = window.document.createEvent("MouseEvent");
  //ev.initMouseEvent(
  //    etype,
  //    true /* bubble */, true /* cancelable */,
  //    window, null,
  //    x, y, 0, 0, /* coordinates */
  //    false, false, false, false, /* modifier keys */
  //    0 /*left*/, null
  //);
  var ev = new MouseEvent(etype, {
    'view': window,
    'bubbles': true,
    'cancelable': true,
    'screenX': x,
    'screenY': y
  });

  el.dispatchEvent(ev);
}

function click(el) {
    if (!el) {
      console.log('cannot click on undefined');
      return;
    }
    eventFire(el, 'mousedown');
    setTimeout(()=>eventFire(el, 'mouseup'), 0);
    setTimeout(()=>eventFire(el, 'mouseout'), 1);
}

function getPresentationIframe() {
    return window.document.getElementsByClassName("punch-present-iframe")[0]
}

function getPresentation() {
    var presentationIframe = getPresentationIframe();
    return presentationIframe ? presentationIframe.contentWindow.document : undefined;
}

function getSlideMenuButton() {
  return getPresentation()?.querySelector('div[class*="goog-inline-block goog-flat-menu-button"]')
}

function hasEditAccess() {
  return !window.document.querySelector('#docs-access-level-indicator');
}

function getPresentationButton() {
  return window.document.getElementById('punch-start-presentation-left');
}

function startPresentationMode() {
  if (getPresentation()) return; // already in presentation mode
  var presentationButton = getPresentationButton();
  mouseEventFire(presentationButton, 'mousedown');
  setTimeout(() => mouseEventFire(presentationButton, 'mouseup'), 0);
}

function goToSlide(slideNum) {
    var presentation = getPresentation();
    var slideMenu = presentation.querySelector('div[class="goog-menu goog-menu-vertical"][role="listbox"]');
    if (!slideMenu) {
      if (!getSlideMenuButton()) {
        console.log('Waiting for slide menu button to appear');
        return 
      }
      console.log('Opening the slide menu!');

      mouseEventFire(getSlideMenuButton(), 'mousedown');
      setTimeout(() => mouseEventFire(getSlideMenuButton(), 'mouseup'), 0);
      setTimeout(() => mouseEventFire(getSlideMenuButton(), 'mousedown'), 1);
      return;
    }

    // index starts at 1
    slideNum = clamp(slideNum, 1, slideMenu.children.length);
    const child = slideMenu.children[slideNum - 1];
    click(child);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
};

function getSlideNumberFromPresentationMenu() {
  var slideMenuText = getSlideMenuButton()?.innerText;
  return slideMenuText ? slideMenuText.match(/(\d+)/)[1] : undefined;
}

function addTemporaryKey(obj, key, lifetimeMs) {
  if (obj.hasOwnProperty(key)) {
    clearTimeout(obj[key]);
  }
  obj[key] = setTimeout(() => delete obj[key], lifetimeMs);
}

// Main functions =====
function startPresent() {
  if (isPresenting()) {
    return;
  }
  window.slideSyncPresentRecentSlides = {};

  var pollLocalSlideNumber = () => {
    if (getPresentation()) {
      var slideNumber = getSlideNumberFromPresentationMenu();
      if (slideNumber) {
        var titleNumber = getSlideNumberFromTitle();

        // local change
        if (!titleNumber || window.slideSyncPresentCurrentLocalSlide != slideNumber) {
          if (slideNumber != titleNumber) {
            setSlideTitle(slideNumber);
          }
        }
        // remote change
        // when flipping through slides the title updates with a delay. Ignore expected title changes
        // however, if the title doesn't get to the current slide soon enough, switch to that slide
        // this can occur if there are multiple hosts changing the slide at the same time.
        else {
          if (slideNumber != titleNumber && !window.slideSyncPresentRecentSlides[titleNumber]) {
            goToSlide(titleNumber);
          }
        }
        addTemporaryKey(window.slideSyncPresentRecentSlides, slideNumber, 2000);
        window.slideSyncPresentCurrentLocalSlide = slideNumber;
      } else {
        console.log("couldn't find slide menu");
      }
      setStatus();
    } else {
      //setStatus('Sync Paused');
      console.log('go to Present');
    }
  }
  window.slideSyncPresentInterval = setInterval(pollLocalSlideNumber, 100);
  pollLocalSlideNumber();
}

function stopPresent() {
  if (window.slideSyncPresentInterval) {
    clearInterval(window.slideSyncPresentInterval);
    window.slideSyncPresentInterval = null;
    window.slideSyncPresentRecentSlides = null;
    cleanupSlideTitle();
  }
}

function startView() {
  if (isViewing()) {
    return;
  }
  var pollSlideNumber = () => {
    var slideNumber = getSlideNumberFromTitle();

    if (!slideNumber) {
      setStatus('Waiting for host...');
      return;
    }

    if (getPresentation()) {
      var currentSlideNumber = getSlideNumberFromPresentationMenu();
      if (currentSlideNumber && currentSlideNumber != slideNumber)
        goToSlide(slideNumber)
      setStatus();
    } else {
      //setStatus('Sync Paused');
      console.log('go to Present');
    }
  }
  window.slideSyncViewInterval = setInterval(pollSlideNumber, 100);
  pollSlideNumber();
}

function stopView() {
  if (window.slideSyncViewInterval) {
    clearInterval(window.slideSyncViewInterval);
    window.slideSyncViewInterval = null;
  }
}

function isPresenting() {
  return !!window.slideSyncPresentInterval;
}
function isViewing() {
  return !!window.slideSyncViewInterval;
}

// clear all intervals when rerunning the script
stopPresent();
stopView();



// UI ================

function removeExistingUI() {
  var existingContainer = getUI();
  if (existingContainer) {
    existingContainer.parentNode.removeChild(existingContainer);
  }
}

function getUI() {
  var uiInDefaultView = window.document.getElementById('slide-sync-base');
  if (uiInDefaultView) return uiInDefaultView;
  var uiInPresentation = getUIInPresentation();
  if (uiInPresentation) return uiInPresentation;
  return null;
}

function getUIInPresentation() {
  return getPresentation()?.getElementById('slide-sync-base');
}

function addScopedStyle (parent, styleString) {
  const style = document.createElement('style');
  style.scoped = true;
  parent.appendChild(style);
  style.textContent = styleString;
}

function ensureCss(context) {
  addScopedStyle(context, `
    #slide-sync-container {
      position:fixed;
      top: 0;
      left: 0;
      right: 0;
      display:flex;
      justify-content:center;
      pointer-events: none;
      z-index: 999;
    }


    @keyframes fadeInFromNone {
        10% {
            transform: translateY(0px);
            opacity: 1;
        }

        50% {
            transform: translateY(0px);
            opacity: 1;
        }
    }

    #slide-sync-bar-anim {
      pointer-events: all;

      transition: opacity 1s 0.5s, transform 1s 0.5s;
      animation: fadeInFromNone 3s ease-out;
    }
    #slide-sync-bar-anim:not(.paused) {
      opacity: 0.1;
      transform: translateY(-20px);
    }
    #slide-sync-bar-anim:hover {
      opacity: 1;
      transform: translateY(0px);
      transition: opacity 0.1s, transform 0.1s;
      animation: fadeInFromNone 0s;
    }


    #slide-sync-bar {
      background-color: white;
      padding: 6px 8px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 0 0 10px 10px;
      margin-top: -1px;
      display: flex;
      flex-direction: row;
      align-items: center;
      box-shadow: rgba(0,0,0,0.5) 0px 1px 12px -1px;

      transition: opacity 1s 0.5s, transform 1s 0.5s;
      animation: fadeInFromNone 3s ease-out;
    }
    #slide-sync-bar:not(.paused) {
      opacity: 0.1;
      transform: translateY(-25px);
    }
    #slide-sync-bar-anim:hover #slide-sync-bar {
      opacity: 1;
      transform: translateY(0px);
      transition: opacity 0.1s, transform 0.1s;
      animation: fadeInFromNone 0s;
    }

    #slide-sync-logo {
      margin: 0;
      margin-left: 6px;
      font-size: 1.2em;
      font-family: "Google Sans",Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
      cursor: default;
      user-select: none;
    }
    .slide-sync-button {
      margin-left: 8px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      outline:0;
      cursor: pointer;
    }
    .slide-sync-button.disabled {
      points-events: none;
      opacity: .4;
      cursor: default;
    }
    .slide-sync-button.primary {
      background-color: #fbbc04;
      border: 0;
    }
    .slide-sync-button p {
      margin: 8px;
      user-select: none;
      font-weight:500;
      font-family: "Google Sans",Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
    }
    .slide-sync-button.primary:hover {
      background-color: #fbc117;
      border: 0;
    }
    .slide-sync-button.primary:active {
      background-color: #fcd154;
      border: 0;
    }
    .slide-sync-button:hover {
      background-color: #fffdf6;
      border: 1px solid #feedbc;
    }
    .slide-sync-button:active {
      background-color: #fff7e1;
      border: 1px solid #fee8ac;
    }
    #slide-sync-message {
      margin-left: 12px;
      margin-right: 6px;
      margin-top: 0;
      margin-bottom: 0;
      cursor: default;
      user-select: none;
    }
  `);
}

function createTooltip(el, message) {
  el.setAttribute('data-tooltip', message);
}

function setButtonsVisible(stopPresent, stopView, present, view) {
  var slideBase = getUI() || getUIInPresentation();
  slideBase.querySelector('#slide-sync-button-stopPresenting').style.display = stopPresent ? 'block' : 'none';
  slideBase.querySelector('#slide-sync-button-stopViewing').style.display = stopView ? 'block' : 'none';
  slideBase.querySelector('#slide-sync-button-present').style.display = present ? 'block' : 'none';
  slideBase.querySelector('#slide-sync-button-view').style.display = view ? 'block' : 'none';
}

function setUIStateNone() {
  setStatus();
  setButtonsVisible(false, false, true, true);
}

function setUIStateViewing() {
  setButtonsVisible(false, true, false, false);
}

function setUIStatePresenting() {
  setButtonsVisible(true, false, false, false);
}

function setUIStateNotAPresentation() {
  setStatus("Only works on Google Slides");
  setButtonsVisible(false, false, false, false);
}

function addClass(el, className) {
  if (!el.classList.contains(className)) {
    el.classList.add(className);
  }
}
function removeClass(el, className) {
  if (el.classList.contains(className)) {
    el.classList.remove(className);
  }
}

function setPaused(isPaused) {
  var slideBase = getUI() || getUIInPresentation();
  if (!slideBase) return;
  var slideBarOuter = slideBase.querySelector('#slide-sync-bar-anim');
  var slideBarInner = slideBase.querySelector('#slide-sync-bar');
  var pausedClassName = 'paused';
  if (isPaused) {
    addClass(slideBarOuter, pausedClassName);
    addClass(slideBarInner, pausedClassName);
  } else {
    removeClass(slideBarOuter, pausedClassName);
    removeClass(slideBarInner, pausedClassName);
  }
}

function setStatus(statusMessage) {
  var slideBase = getUI() || getUIInPresentation();
  if (!slideBase) return;
  var text = slideBase.querySelector('#slide-sync-message');
  if (!statusMessage) {
    if (text.style.display != 'none') {
      text.style.display = 'none';
      setPaused(false);
    }
  } else {
    text.style.display = 'block';
    if (text.textContent != statusMessage) {
      text.textContent = statusMessage;
      setPaused(true);
    }
  }
}

function createUI() {
  removeExistingUI();

  var div = window.document.createElement('div');
  div.id = "slide-sync-base";
  div.innerHTML = `
<div id="slide-sync-container">
  <div id="slide-sync-bar-anim">
    <div id="slide-sync-bar">
      <p id="slide-sync-logo">SlideSync</p>
      <div id="slide-sync-button-present" class="slide-sync-button"><p>Host</p></div>
      <div id="slide-sync-button-view" class="slide-sync-button primary"><p>Watch</p></div>
      <div id="slide-sync-button-stopPresenting" class="slide-sync-button primary"><p>Stop Hosting</p></div>
      <div id="slide-sync-button-stopViewing" class="slide-sync-button primary"><p>Stop Watching</p></div>
      <p id="slide-sync-message">Message</p>
      </div>
    </div>
  </div>
</div>
  `;

  ensureCss(div);

  window.document.body.append(div)

  var presentButton = div.querySelector('#slide-sync-button-present');
  presentButton.addEventListener('click', () => {
    if (!hasEditAccess()) return;
    startPresent();
    setUIStatePresenting();
    startPresentationMode();
  });
  if (!hasEditAccess()) {
    presentButton.classList.add("disabled")
    createTooltip(presentButton, 'Need edit permission to Host');
  }
  var viewButton = div.querySelector('#slide-sync-button-view');
  viewButton.addEventListener('click', () => {
    startView();
    setUIStateViewing();
    startPresentationMode();
  });
  var presentStopButton = div.querySelector('#slide-sync-button-stopPresenting');
  presentStopButton.addEventListener('click', () => {
    stopPresent();
    setUIStateNone();
  });
  var viewStopButton = div.querySelector('#slide-sync-button-stopViewing');
  viewStopButton.addEventListener('click', () => {
    stopView();
    setUIStateNone();
  });

  setStatus();
  if (!isGoogleSlidesPresentation()) setUIStateNotAPresentation();
  else if (isViewing()) setUIStateViewing();
  else if (isPresenting()) setUIStatePresenting();
  else setUIStateNone();
}

removeExistingUI();
// check if presentation mode
if (window.slideSyncInterval) {
  clearInterval(window.slideSyncInterval);
}
var slideSyncNoUICount = 0;
var updateUI = () => {

  // there is a period while transitioning from full screen -> not full screen that the 
  // browser context is null, so no UI is found. Wait a bit so it has time to un-full-screen
  // before creating new UI
  // It takes even longer to move from not full screen to full screen, so have a super high count
  if (!getUI()) {
    slideSyncNoUICount++;
    if (slideSyncNoUICount > (getPresentation() ? 4 : 2)) {
      createUI();
      slideSyncNoUICount = 0;
    }
  }
  var presentation = getPresentation();
  var inPresentation = getUIInPresentation();

  if (getUI()) {
    // presentation.body is null for one frame
    if (presentation && !inPresentation && presentation.body) {
      presentation.body.appendChild(getUI());
    } else if (!presentation && inPresentation) {
      window.document.body.appendChild(getUI())
    }
  }
}

createUI();
updateUI();
window.slideSyncInterval = setInterval(updateUI, 500);

