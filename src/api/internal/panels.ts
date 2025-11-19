function makePanelInteractive(panel: HTMLElement) {
    const minWidth = panel.dataset.w || 200;
    const minHeight = panel.dataset.h || 200;

    function setMin(zero = false) {
        panel.style.minWidth = `${zero ? 0 : minWidth}px`;
        panel.style.minHeight = `${zero ? 0 : minHeight}px`;
    }
    setMin();

    const header = panel.querySelector<HTMLElement>(".panel-header");
    const toggleBtn = panel.querySelector<HTMLButtonElement>(".panel-toggle-btn");

    if (!header || !toggleBtn) {
        console.error("Panel header or toggle button not found");
        return;
    }

    const bringToFront = () => {
        document.querySelectorAll(".panel").forEach(p => {
            if (p !== panel) {
                (p as HTMLElement).style.zIndex = "100";
            }
        });
        panel.style.zIndex = "101";
    };

    panel.addEventListener("mousedown", bringToFront, true);

    let isDragging = false;
    let offsetX: number, offsetY: number;

    const onMouseDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;

        isDragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        const maxX = window.innerWidth - panel.offsetWidth;
        const maxY = window.innerHeight - panel.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        panel.style.left = `${newX}px`;
        panel.style.top = `${newY}px`;
    };

    const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };

    header.addEventListener("mousedown", onMouseDown);

    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.classList.toggle("collapsed");
        if (panel.classList.contains("collapsed")) {
            setMin(true);
            toggleBtn.textContent = "+";
        } else {
            setMin();
            toggleBtn.textContent = "-";
        }
    });
}

export function initializePanels() {
    document.querySelectorAll<HTMLElement>(".panel").forEach(makePanelInteractive);
}
