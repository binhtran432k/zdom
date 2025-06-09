import { state } from "zdom";

import logo from "./logo.svg";
import reactLogo from "./react.svg";

import "./App.css";

const App = () => {
	const count = state(0);

	return (
		<>
			<div>
				<a href="https://vite.dev" target="_blank" rel="noreferrer">
					<img src={logo} class="logo" alt="Bun logo" />
				</a>
				<a href="https://react.dev" target="_blank" rel="noreferrer">
					<img src={reactLogo} class="logo react" alt="React logo" />
				</a>
			</div>
			<h1>Bun + React</h1>
			<div class="card">
				<button onclick={() => ++count.val}>count is {count}</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p class="read-the-docs">
				Click on the Bun and React logos to learn more
			</p>
		</>
	);
};

export default App;
