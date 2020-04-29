"use strict";

// check if this website is a google slides page
function isGoogleSlidesPresentation() {
  return window.location.host === "docs.google.com" && window.location.pathname.startsWith("/presentation") && getPresentationButton();
}

var slideTitlePrefix = '▹';
var slideTitleRegex = /▹(\d+)$/;

function setSlideTitle(slideNum) {
  var title = window.document.querySelector('.docs-title-input');
  var currentTitle = title.value;
  var nextTitle = currentTitle.match(slideTitleRegex) ? currentTitle.replace(slideTitleRegex, function (j, a) {
    return slideTitlePrefix + slideNum;
  }) : currentTitle + slideTitlePrefix + slideNum;
  title.value = nextTitle;
  setTimeout(function () {
    return eventFire(title, "focus");
  }, 0);
  setTimeout(function () {
    return eventFire(title, "blur");
  }, 1);
}

function cleanupSlideTitle() {
  var title = window.document.querySelector('.docs-title-input');
  title.value = title.value.replace(slideTitleRegex, '');
  setTimeout(function () {
    return eventFire(title, "focus");
  }, 0);
  setTimeout(function () {
    return eventFire(title, "blur");
  }, 1);
}

function incrementTitle() {
  var title = document.querySelector('.docs-title-input');
  var currentTitle = title.value;
  var nextTitle = currentTitle.match(slideTitleRegex) ? currentTitle.replace(slideTitleRegex, function (j, a) {
    return slideTitlePrefix + (parseInt(a) + 1);
  }) : currentTitle + slideTitlePrefix + "1";
  title.value = nextTitle;
  setTimeout(function () {
    return eventFire(title, "focus");
  }, 0);
  setTimeout(function () {
    return eventFire(title, "blur");
  }, 1);
}

function getSlideNumberFromTitle() {
  var title = window.document.querySelector('.docs-title-input');
  var match = title.value.match(slideTitleRegex);

  if (match) {
    return match[1];
  }

  return undefined;
}

function eventFire(el, etype) {
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = window.document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

function mouseEventFire(el, etype, x, y) {
  if (!x || !y) {
    var bounds = el.getBoundingClientRect();
    x = bounds.left + bounds.width / 2;
    y = bounds.top + bounds.height / 2;
  } //var ev = window.document.createEvent("MouseEvent");
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
  setTimeout(function () {
    return eventFire(el, 'mouseup');
  }, 0);
  setTimeout(function () {
    return eventFire(el, 'mouseout');
  }, 1);
}

function getPresentationIframe() {
  return window.document.getElementsByClassName("punch-present-iframe")[0];
}

function getPresentation() {
  var presentationIframe = getPresentationIframe();
  return presentationIframe ? presentationIframe.contentWindow.document : undefined;
}

function getSlideMenuButton() {
  var _getPresentation;

  return (_getPresentation = getPresentation()) === null || _getPresentation === void 0 ? void 0 : _getPresentation.querySelector('div[class*="goog-inline-block goog-flat-menu-button"]');
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
  setTimeout(function () {
    return mouseEventFire(presentationButton, 'mouseup');
  }, 0);
}

function goToSlide(slideNum) {
  var presentation = getPresentation();
  var slideMenu = presentation.querySelector('div[class="goog-menu goog-menu-vertical"][role="listbox"]');

  if (!slideMenu) {
    if (!getSlideMenuButton()) {
      console.log('Waiting for slide menu button to appear');
      return;
    }

    console.log('Opening the slide menu!');
    mouseEventFire(getSlideMenuButton(), 'mousedown');
    setTimeout(function () {
      return mouseEventFire(getSlideMenuButton(), 'mouseup');
    }, 0);
    setTimeout(function () {
      return mouseEventFire(getSlideMenuButton(), 'mousedown');
    }, 1);
    return;
  } // index starts at 1


  slideNum = clamp(slideNum, 1, slideMenu.children.length);
  var child = slideMenu.children[slideNum - 1];
  click(child);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

;

function getSlideNumberFromPresentationMenu() {
  var _getSlideMenuButton;

  var slideMenuText = (_getSlideMenuButton = getSlideMenuButton()) === null || _getSlideMenuButton === void 0 ? void 0 : _getSlideMenuButton.innerText;
  return slideMenuText ? slideMenuText.match(/(\d+)/)[1] : undefined;
}

function addTemporaryKey(obj, key, lifetimeMs) {
  if (obj.hasOwnProperty(key)) {
    clearTimeout(obj[key]);
  }

  obj[key] = setTimeout(function () {
    return delete obj[key];
  }, lifetimeMs);
} // Main functions =====


function startPresent() {
  if (isPresenting()) {
    return;
  }

  window.slideSyncPresentRecentSlides = {};

  var pollLocalSlideNumber = function pollLocalSlideNumber() {
    if (getPresentation()) {
      var slideNumber = getSlideNumberFromPresentationMenu();

      if (slideNumber) {
        var titleNumber = getSlideNumberFromTitle(); // local change

        if (!titleNumber || window.slideSyncPresentCurrentLocalSlide != slideNumber) {
          if (slideNumber != titleNumber) {
            setSlideTitle(slideNumber);
          }
        } // remote change
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
  };

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

  var pollSlideNumber = function pollSlideNumber() {
    var slideNumber = getSlideNumberFromTitle();

    if (!slideNumber) {
      setStatus('Waiting for host...');
      return;
    }

    if (getPresentation()) {
      var currentSlideNumber = getSlideNumberFromPresentationMenu();
      if (currentSlideNumber && currentSlideNumber != slideNumber) goToSlide(slideNumber);
      setStatus();
    } else {
      //setStatus('Sync Paused');
      console.log('go to Present');
    }
  };

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
} // clear all intervals when rerunning the script


stopPresent();
stopView(); // UI ================

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
  var _getPresentation2;

  return (_getPresentation2 = getPresentation()) === null || _getPresentation2 === void 0 ? void 0 : _getPresentation2.getElementById('slide-sync-base');
}

function addScopedStyle(parent, styleString) {
  var style = document.createElement('style');
  style.scoped = true;
  parent.appendChild(style);
  style.textContent = styleString;
}

function ensureCss(context) {
  addScopedStyle(context, "\n    #slide-sync-container {\n      position:fixed;\n      top: 0;\n      left: 0;\n      right: 0;\n      display:flex;\n      justify-content:center;\n      pointer-events: none;\n      z-index: 999;\n    }\n\n\n    @keyframes fadeInFromNone {\n        10% {\n            transform: translateY(0px);\n            opacity: 1;\n        }\n\n        50% {\n            transform: translateY(0px);\n            opacity: 1;\n        }\n    }\n\n    #slide-sync-bar-anim {\n      pointer-events: all;\n\n      transition: opacity 1s 0.5s, transform 1s 0.5s;\n      animation: fadeInFromNone 3s ease-out;\n    }\n    #slide-sync-bar-anim:not(.paused) {\n      opacity: 0.1;\n      transform: translateY(-20px);\n    }\n    #slide-sync-bar-anim:hover {\n      opacity: 1;\n      transform: translateY(0px);\n      transition: opacity 0.1s, transform 0.1s;\n      animation: fadeInFromNone 0s;\n    }\n\n\n    #slide-sync-bar {\n      background-color: white;\n      padding: 6px 8px;\n      border: 1px solid rgba(0, 0, 0, 0.1);\n      border-radius: 0 0 10px 10px;\n      margin-top: -1px;\n      display: flex;\n      flex-direction: row;\n      align-items: center;\n      box-shadow: rgba(0,0,0,0.5) 0px 1px 12px -1px;\n\n      transition: opacity 1s 0.5s, transform 1s 0.5s;\n      animation: fadeInFromNone 3s ease-out;\n    }\n    #slide-sync-bar:not(.paused) {\n      opacity: 0.1;\n      transform: translateY(-25px);\n    }\n    #slide-sync-bar-anim:hover #slide-sync-bar {\n      opacity: 1;\n      transform: translateY(0px);\n      transition: opacity 0.1s, transform 0.1s;\n      animation: fadeInFromNone 0s;\n    }\n\n    #slide-sync-logo {\n      margin: 0;\n      margin-left: 6px;\n      font-size: 1.2em;\n      font-family: \"Google Sans\",Roboto,RobotoDraft,Helvetica,Arial,sans-serif;\n      cursor: default;\n      user-select: none;\n    }\n    .slide-sync-button {\n      margin-left: 8px;\n      border: 1px solid rgba(0, 0, 0, 0.1);\n      border-radius: 4px;\n      outline:0;\n      cursor: pointer;\n    }\n    .slide-sync-button.disabled {\n      points-events: none;\n      opacity: .4;\n      cursor: default;\n    }\n    .slide-sync-button.primary {\n      background-color: #fbbc04;\n      border: 0;\n    }\n    .slide-sync-button p {\n      margin: 8px;\n      user-select: none;\n      font-weight:500;\n      font-family: \"Google Sans\",Roboto,RobotoDraft,Helvetica,Arial,sans-serif;\n    }\n    .slide-sync-button.primary:hover {\n      background-color: #fbc117;\n      border: 0;\n    }\n    .slide-sync-button.primary:active {\n      background-color: #fcd154;\n      border: 0;\n    }\n    .slide-sync-button:hover {\n      background-color: #fffdf6;\n      border: 1px solid #feedbc;\n    }\n    .slide-sync-button:active {\n      background-color: #fff7e1;\n      border: 1px solid #fee8ac;\n    }\n    #slide-sync-message {\n      margin-left: 12px;\n      margin-right: 6px;\n      margin-top: 0;\n      margin-bottom: 0;\n      cursor: default;\n      user-select: none;\n    }\n  ");
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
  div.innerHTML = "\n<div id=\"slide-sync-container\">\n  <div id=\"slide-sync-bar-anim\">\n    <div id=\"slide-sync-bar\">\n      <p id=\"slide-sync-logo\">SlideSync</p>\n      <div id=\"slide-sync-button-present\" class=\"slide-sync-button\"><p>Host</p></div>\n      <div id=\"slide-sync-button-view\" class=\"slide-sync-button primary\"><p>Watch</p></div>\n      <div id=\"slide-sync-button-stopPresenting\" class=\"slide-sync-button primary\"><p>Stop Hosting</p></div>\n      <div id=\"slide-sync-button-stopViewing\" class=\"slide-sync-button primary\"><p>Stop Watching</p></div>\n      <p id=\"slide-sync-message\">Message</p>\n      </div>\n    </div>\n  </div>\n</div>\n  ";
  ensureCss(div);
  window.document.body.append(div);
  var presentButton = div.querySelector('#slide-sync-button-present');
  presentButton.addEventListener('click', function () {
    if (!hasEditAccess()) return;
    startPresent();
    setUIStatePresenting();
    startPresentationMode();
  });

  if (!hasEditAccess()) {
    presentButton.classList.add("disabled");
    createTooltip(presentButton, 'Need edit permission to Host');
  }

  var viewButton = div.querySelector('#slide-sync-button-view');
  viewButton.addEventListener('click', function () {
    startView();
    setUIStateViewing();
    startPresentationMode();
  });
  var presentStopButton = div.querySelector('#slide-sync-button-stopPresenting');
  presentStopButton.addEventListener('click', function () {
    stopPresent();
    setUIStateNone();
  });
  var viewStopButton = div.querySelector('#slide-sync-button-stopViewing');
  viewStopButton.addEventListener('click', function () {
    stopView();
    setUIStateNone();
  });
  setStatus();
  if (!isGoogleSlidesPresentation()) setUIStateNotAPresentation();else if (isViewing()) setUIStateViewing();else if (isPresenting()) setUIStatePresenting();else setUIStateNone();
}

removeExistingUI(); // check if presentation mode

if (window.slideSyncInterval) {
  clearInterval(window.slideSyncInterval);
}

var slideSyncNoUICount = 0;

var updateUI = function updateUI() {
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
      window.document.body.appendChild(getUI());
    }
  }
};

createUI();
updateUI();
window.slideSyncInterval = setInterval(updateUI, 500);