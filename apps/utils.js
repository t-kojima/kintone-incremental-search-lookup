export function createId() {
  return Math.random()
    .toString(36)
    .slice(-8)
}

const mouseClickEvents = ['mousedown', 'click', 'mouseup']
export function simulateMouseClick(element) {
  mouseClickEvents.forEach(mouseEventType =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1,
      })
    )
  )
}
