export function makeDraggable(panelEl) {
  if (!panelEl) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  panelEl.style.position = "fixed";

  function isInteractiveElement(target) {
    return (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("label") ||
      target.closest("a") ||
      //  treat palette + list items as interactive
      target.closest("#colorPalette") ||
      target.closest(".palette-color") ||
      target.closest("#usersList")
    );
  }

  panelEl.addEventListener("pointerdown", (e) => {
    // if clicked inside an interactive element, don't drag
    if (isInteractiveElement(e.target)) return;

    isDragging = true;

    const rect = panelEl.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    panelEl.setPointerCapture(e.pointerId);
    panelEl.style.cursor = "grabbing";
  });

  panelEl.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    // keep inside window
    const rect = panelEl.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width;
    const maxTop = window.innerHeight - rect.height;

    newLeft = Math.max(0, Math.min(maxLeft, newLeft));
    newTop = Math.max(0, Math.min(maxTop, newTop));

    panelEl.style.left = `${newLeft}px`;
    panelEl.style.top = `${newTop}px`;
    panelEl.style.right = "auto";
  });

  function stopDragging() {
    isDragging = false;
    panelEl.style.cursor = "grab";
  }

  panelEl.addEventListener("pointerup", stopDragging);
  panelEl.addEventListener("pointercancel", stopDragging);

  panelEl.style.cursor = "grab";
}
