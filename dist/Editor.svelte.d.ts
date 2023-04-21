import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: Record<string, never>;
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type EditorProps = typeof __propDef.props;
export type EditorEvents = typeof __propDef.events;
export type EditorSlots = typeof __propDef.slots;
export default class Editor extends SvelteComponentTyped<EditorProps, EditorEvents, EditorSlots> {
}
export {};
