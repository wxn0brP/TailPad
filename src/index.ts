import { render } from "#api/internal/utils";
import "#api/internal/yjs";
import { initializePanels } from "#api/internal/panels";
import "#style.scss";
import "@wxn0brp/flanker-dialog/style.css";
import "@wxn0brp/flanker-ui/html";

initializePanels();
render();