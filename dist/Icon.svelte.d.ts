import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        /**
             * Path data for the icon. See https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d.
             */ d: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type IconProps = typeof __propDef.props;
export type IconEvents = typeof __propDef.events;
export type IconSlots = typeof __propDef.slots;
export default class Icon extends SvelteComponentTyped<IconProps, IconEvents, IconSlots> {
}
export {};
