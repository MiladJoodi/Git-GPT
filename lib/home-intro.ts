let countedThisLoad = false;

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return true;
  }
}

export function consumeHomeIntro(): boolean {
  if (prefersReducedMotion()) {
    return false;
  }
  if (countedThisLoad) {
    return false;
  }
  countedThisLoad = true;
  return true;
}

export function clearHomeIntro() {
  countedThisLoad = false;
}
