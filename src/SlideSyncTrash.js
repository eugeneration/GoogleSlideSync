

/*

function togglePresentation() {
    var presentButton = window.document.querySelector('#punch-start-presentation-left')
    eventFire(presentButton, 'focus');
    click(presentButton);
}


function togglePresentation() {
var keyboardEvent = window.document.createEvent("KeyboardEvent");
var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";

keyboardEvent[initMethod](
  "keydown", // event type: keydown, keyup, keypress
  true,      // bubbles
  true,      // cancelable
  window,    // view: should be window
  true,     // ctrlKey
  false,     // altKey
  false,     // shiftKey
  true,     // metaKey
  13,        // keyCode: unsigned long - the virtual key code, else 0
  0          // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
);
document.dispatchEvent(keyboardEvent);
}

*/