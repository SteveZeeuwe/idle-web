export type TapTrigger = 'up' | 'down'

export interface TapOptions<TToken = unknown> {
  /**
   * Maximum pointer movement (in px) allowed between down and up for a tap to count.
   */
  tolerancePx?: number
  /**
   * When to fire the callback: on pointer 'up' (default) or immediately on pointer 'down'.
   */
  trigger?: TapTrigger
  /**
   * Supply a token that represents the current actionable target/state.
   *
   * How it works:
   * - The value returned here is captured on pointerdown and stored.
   * - On pointerup we call getToken() again and compare the two using Object.is().
   * - If they are not equal, the tap is ignored.
   *
   * Why use it:
   * - Prevents accidental activations when the underlying item/view changes between down and up
   *   (e.g., list reordering/virtualization, route change, disabled state toggled).
   * - Ensures the tap only triggers for the same logical target the user started interacting with.
   *
   * What to return:
   * - Any value for which Object.is(oldToken, newToken) reliably reflects "same target/state".
   *   For objects this is reference equality; for primitives it's value equality.
   */
  getToken?: () => TToken
}

export function useTap(
  cb: (ev: PointerEvent | MouseEvent | KeyboardEvent) => void,
  options: TapOptions = {},
) {
  const tolerance = options.tolerancePx ?? 12
  const trigger: TapTrigger = options.trigger ?? 'up'
  let suppressNextClick = false
  let pressStart: { x: number; y: number; token?: unknown } | null = null
  let swallowNextClick = false

  function installGlobalClickSuppressor() {
    if (!swallowNextClick) return
    const handler = (ev: Event) => {
      ev.preventDefault()
      ev.stopPropagation()
      swallowNextClick = false
      window.removeEventListener('click', handler, true)
    }
    window.addEventListener('click', handler, true)
  }

  function onPointerDown(e: PointerEvent) {
    // For mouse, only left button
    if (e.pointerType === 'mouse' && e.button !== 0) return

    if (trigger === 'down') {
      suppressNextClick = true
      swallowNextClick = true
      cb(e)
      installGlobalClickSuppressor()
      // still record pressStart to allow cancel/leave to clear state cleanly
      // Capture token snapshot at press start so we can validate on release
      pressStart = { x: e.clientX, y: e.clientY, token: options.getToken?.() }
      return
    }

    // Capture token snapshot at press start so we can validate on release
    pressStart = { x: e.clientX, y: e.clientY, token: options.getToken?.() }
  }

  function onPointerUp(e: PointerEvent) {
    if (trigger === 'down') {
      // already fired on down; just clear state
      pressStart = null
      return
    }
    if (!pressStart) return
    const dx = e.clientX - pressStart.x
    const dy = e.clientY - pressStart.y
    const movedSq = dx * dx + dy * dy
    const within = movedSq <= tolerance * tolerance
    // Validate that the target/state hasn't changed between down and up using the token
    const tokenOk = options.getToken ? Object.is(pressStart.token, options.getToken()) : true
    if (within && tokenOk) {
      suppressNextClick = true
      cb(e)
    }
    pressStart = null
  }

  function onPointerCancel() {
    pressStart = null
  }
  function onPointerLeave() {
    pressStart = null
  }

  function onClick(e: MouseEvent) {
    if (swallowNextClick) {
      // Global suppressor should have caught it, but guard anyway
      swallowNextClick = false
      return
    }
    if (suppressNextClick) {
      suppressNextClick = false
      e.preventDefault()
      return
    }
    // Fallback for non-pointer environments
    cb(e)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      cb(e)
    }
  }

  return { onPointerDown, onPointerUp, onPointerCancel, onPointerLeave, onClick, onKeyDown }
}

export default useTap
