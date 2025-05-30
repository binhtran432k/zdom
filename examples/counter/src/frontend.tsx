import { setupClient, toDoms } from "zdom/client";

import App from "./App";

setupClient();

import "./index.css";

const elem = document.getElementById("root")!;
const app = <App />;

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root: typeof elem = import.meta.hot.data.root ??= elem;
  root.replaceChildren(...toDoms(app));
} else {
  // The hot module reloading API is not available in production.
  elem.append(...toDoms(app));
}
