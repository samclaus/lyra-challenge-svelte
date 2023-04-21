import "./app.css";
import Editor from "./lib/Editor.svelte";

const app = new Editor({
    target: document.body,
});

export default app;
