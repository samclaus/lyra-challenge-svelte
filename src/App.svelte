<script lang="ts">
    import { onMount } from "svelte";
    import { clonePolygon, closestPointOnSimplePolygonToTarget, type Point, type Polygon } from "./closest-point";
    import type { Unsubscriber } from "svelte/store";

    type Tool = "select" | "move" | "closest-points" | "triangle" | "square" | "hexagon";

    /**
     * Maps from key code (as in, the 'key' property of a KeyboardEvent) to tool, for
     * keyboard shortcuts.
     */
    const KEY_TO_TOOL: { readonly [key: string]: Tool } = {
        1: "select",
        2: "move",
        3: "closest-points",
        4: "triangle",
        5: "square",
        6: "hexagon"
    };

    /**
     * These are used to compute the dotted line preview for adding new polygons, using
     * the mouse coordinates from "mousemove" events to translate the respective polygon.
     * 
     * For any tools that do not involve adding shapes, there will be no base polygon and
     * thus no indicator will be shown.
     */
    const BASE_POLYGONS: { readonly [T in Tool]?: Polygon } = {
        triangle: [
            [30, 0],
            [60, 45],
            [0, 45],
        ],
        square: [
            [0, 0],
            [50, 0],
            [50, 50],
            [0, 50],
        ],
        hexagon: [
            [60, 26],
            [45, 52],
            [15, 52],
            [0, 26],
            [15, 0],
            [45, 0],
        ],
    };

    let activeTool: Tool = "triangle";
    let addPolyPreview: Polygon | undefined;
    let polygons: Polygon[] = [];
    let closestPoints: Point[] = [];
    let svgEl: SVGElement;
    let svgWidth: number;
    let svgHeight: number;
    let selectedIndex = -1;

    /**
     * TODO
     *
     * Svelte supports bind:clientWidth and bind:clientHeight (and a couple others) to trivially
     * watch the size of an element with just a couple lines of code, not to mention the reactive
     * stuff gets cleaned up automatically when the component is destroyed, but..
     *
     * Unfortunately, those bindings were implemented before the ResizeObserver API was widely
     * supported, and they work using a hack that involves adding an <iframe> as a child of the
     * observed element, meaning we cannot use them for an <svg> element directly, not to mention
     * worse performance than the ResizeObserver API (although that is irrelevant in this simple
     * scenario). I could have wrapped the <svg> canvas in a <div>, but I decided that was more
     * convoluted than just using a ResizeObserver manually with the Svelte onMount API.
     *
     * See https://github.com/sveltejs/svelte/issues/7583
     */
    onMount((): Unsubscriber => {
        const obs = new ResizeObserver(entries => {
            for (const { contentBoxSize: [size] } of entries) {
                console.log(size.inlineSize, size.blockSize);
            }
        });
        obs.observe(svgEl);
        return () => obs.disconnect(); // Svelte will call this when the component is destroyed
    });

    function onMouseMove(ev: MouseEvent): void {
        const { top, left } = svgEl.getBoundingClientRect();
        const mouseX = ev.clientX - left;
        const mouseY = ev.clientY - top;

        closestPoints = activeTool === "closest-points" ? polygons.map(
            poly => closestPointOnSimplePolygonToTarget(poly, [mouseX, mouseY]),
        ) : [];
        addPolyPreview = BASE_POLYGONS[activeTool]?.map(([x, y]) => [x + mouseX, y + mouseY]);
    }

    function onClick(ev: MouseEvent): void {
        if (activeTool === "select" && ev.target instanceof SVGPolygonElement) {
            const index = +(ev.target.dataset.index as any);

            if (Number.isSafeInteger(index)) {
                selectedIndex = index;
                return;
            }
        }

        const { top, left } = svgEl.getBoundingClientRect();
        const mouseX = ev.clientX - left;
        const mouseY = ev.clientY - top;

        if (addPolyPreview) {
            polygons.push(clonePolygon(addPolyPreview));
            polygons = polygons;
        }
    }

    function onKeyDown(ev: KeyboardEvent): void {
        if (!ev.metaKey && !ev.shiftKey) {
            const tool = KEY_TO_TOOL[ev.key];

            if (tool) {
                ev.preventDefault();
                ev.stopPropagation();
                activeTool = tool;
            }
        }
    }
</script>

<main>

    <div
        id="main-toolbar"
        aria-label="Main toolbar"
        role="toolbar"
        aria-orientation="vertical">

        <button
            aria-label="Select"
            aria-pressed={activeTool === "select"}
            on:click={() => activeTool = "select"}>
            <svg><use xlink:href="#cursor" /></svg>
            <kbd>1</kbd>
        </button>
        <button
            aria-label="Move"
            aria-pressed={activeTool === "move"}
            on:click={() => activeTool = "move"}>
            <svg><use xlink:href="#move" /></svg>
            <kbd>2</kbd>
        </button>
        <button
            style="margin-bottom: 40px;"
            aria-label="Closest points"
            aria-pressed={activeTool === "closest-points"}
            on:click={() => activeTool = "closest-points"}>
            <svg><use xlink:href="#closest-point" /></svg>
            <kbd>3</kbd>
        </button>

        <button
            aria-label="Triangle"
            aria-pressed={activeTool === "triangle"}
            on:click={() => activeTool = "triangle"}>
            <svg><use xlink:href="#triangle" /></svg>
            <kbd>4</kbd>
        </button>
        <button
            aria-label="Square"
            aria-pressed={activeTool === "square"}
            on:click={() => activeTool = "square"}>
            <svg><use xlink:href="#square" /></svg>
            <kbd>5</kbd>
        </button>
        <button
            aria-label="Hexagon"
            aria-pressed={activeTool === "hexagon"}
            on:click={() => activeTool = "hexagon"}>
            <svg><use xlink:href="#hexagon" /></svg>
            <kbd>6</kbd>
        </button>

    </div>


    <!-- This visual interface is inherently keyboard inaccessible -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg
        id="canvas"
        viewBox="0 0 {svgWidth} {svgHeight}"
        xmlns="http://www.w3.org/2000/svg"
        bind:this={svgEl}
        on:click={onClick}>

        {#each polygons as poly, i (i)}
            <polygon
                data-index={i}
                fill={i === selectedIndex ? "#00897B" : "#E53935"}
                stroke="#00897B"
                stroke-width="3"
                points={poly.map(([x, y]) => x + "," + y).join(" ")} />
        {/each}

        <!--
            NOTE: all of the closest point circles are intentionally rendered after ALL
            of the polygons, meaning that if two polygons are overlapping, the closest
            point for the covered one will still be visible.
        -->
        {#each closestPoints as [x, y], i (i)}
            <circle
                fill="#D500F9"
                stroke="#651FFF"
                stroke-width="1"
                cx={x}
                cy={y}
                r="5" />
        {/each}

        {#if addPolyPreview}
            <polygon
                fill="transparent"
                stroke="#FFFF00"
                stroke-width="1"
                stroke-dasharray="1 1"
                points={addPolyPreview.map(([x, y]) => x + "," + y).join(" ")} />
        {/if}

    </svg>

</main>

<svelte:window on:keydown|capture={onKeyDown} on:mousemove={onMouseMove} />

<style>
    main {
        width: 100%;
        height: 100%;

        display: flex;
    }

    #main-toolbar {
        --item-padding: 20px;

        padding: var(--item-padding);

        min-width: 80px;
        height: 100%;
        overflow: auto;

        display: flex;
        flex-direction: column;
        align-items: center;

        background-color: white;
        color: black;
    }

    button {
        position: relative;

        margin: 0;
        padding: 8px;

        background-color: transparent;
        border: 1px solid black;
        border-radius: 4px;
    }

    button:not(:first-child) {
        margin-top: var(--item-padding);
    }

    button[aria-pressed="true"] {
        background-color: #00E676;
    }

    button > svg {
        display: block;
        width: 24px;
        height: 24px;
        line-height: 24px;
    }

    kbd {
        font-family: monospace;
        font-weight: 700;
        color: #444;
        font-size: 14px;
        padding: 2px 6px;
        border: 0.5px solid #777;
        line-height: 14px;
        border-radius: 4px;
        box-shadow: 1px 1px #777;
        background-color: #eee;
        position: relative;
    }

    button > kbd {
        position: absolute;
        top: -10px;
        right: -10px;
    }

    #canvas {
        flex: 1 0 0;
        height: 100%;
    }
</style>
