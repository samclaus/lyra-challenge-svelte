<script lang="ts">
    import { clonePolygon, closestPointOnSimplePolygonToTarget, type Point, type Polygon } from "./geometry";

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
    let selectedIndex = -1;
    let mouseCoordsInSVG: Point | undefined;
    let draggingPolyIndex = -1;
    let draggingPolyCoordsRelativeToMouse: Polygon = [];

    // Most if not all of the tools require some sort of state cleanup to be run when
    // they are deactivated (the "$:" tells the Svelte compiler to analyze variables
    // this scope depends on and re-run the code whenever they change)
    $: {
        if (activeTool !== "select") {
            selectedIndex = -1;
        }
        if (activeTool !== "move") {
            draggingPolyIndex = -1;
        }
        if (activeTool !== "closest-points") {
            closestPoints = [];
        }
    }

    $: if (mouseCoordsInSVG) {
        const [mouseX, mouseY] = mouseCoordsInSVG;
        const _captureCoords = mouseCoordsInSVG; // So TypeScript knows they are defined within closures

        closestPoints = activeTool === "closest-points" ? polygons.map(
            poly => closestPointOnSimplePolygonToTarget(poly, _captureCoords),
        ) : [];
        addPolyPreview = BASE_POLYGONS[activeTool]?.map(
            ([x, y]) => [x + mouseX, y + mouseY],
        );
    } else {
        addPolyPreview = undefined;
        closestPoints = [];
    }

    function getMouseCoordinatesInSVG(ev: MouseEvent): Point {
        const { top, left } = svgEl.getBoundingClientRect();
        return [ev.clientX - left, ev.clientY - top];
    }

    /**
     * Returns the numerical index/ID of the polygon corresponding to the given DOM
     * element, or -1 if the element does not correspond to a polygon.
     */
    function getPolygonIndexForElement(el: unknown): number {
        if (el instanceof SVGPolygonElement) {
            const index = +(el.dataset.index as any);

            if (Number.isSafeInteger(index)) {
                return index;
            }
        }
        return -1;
    }

    /**
     * When a key is pressed (down) from anywhere within the app, we need to check if it is
     * a hotkey. If it is, activate the relevant tool and intercept the event.
     */
    function windowKeyDown(ev: KeyboardEvent): void {
        if (!ev.metaKey && !ev.shiftKey) {
            const tool = KEY_TO_TOOL[ev.key];

            if (tool) {
                ev.preventDefault();
                ev.stopPropagation();
                activeTool = tool;
            }
        }
    }

    /**
     * If the user presses the mouse down on the SVG, we should start a drag operation if:
     * 
     * 1. They are currently using the "move" tool
     * 2. They pressed on one of the polygons, and not any other element (including the SVG itself)
     */
    function svgMouseDown(ev: MouseEvent): void {
        if (activeTool === "move") {
            const index = getPolygonIndexForElement(ev.target);

            if (index >= 0 && index < polygons.length) {
                const poly = polygons[index]!;
                const [mouseX, mouseY] = getMouseCoordinatesInSVG(ev);

                draggingPolyIndex = index;
                draggingPolyCoordsRelativeToMouse = poly.map(
                    // NOTE: it is important that we make a DEEP copy of this polygon
                    ([x, y]) => [x - mouseX, y - mouseY],
                );
            }
        }
    }

    /**
     * Whenever the user stops holding the mouse down, just make sure to stop any drag operation.
     */
    function svgMouseUp(ev: MouseEvent): void {
        draggingPolyIndex = -1;
    }

    /**
     * All of tools, except the "move" and "closest-points" tools, care about mouse clicks
     * within the SVG. For the "select" tool, any polygon that gets clicked on should be
     * marked as the selected on. For any of the polygon creation tools, we can simply
     * make the current dotted line preview polygon 'permanent' by copying it into the
     * polygon array.
     */
    function svgMouseClick(ev: MouseEvent): void {
        if (activeTool === "select") {
            const index = getPolygonIndexForElement(ev.target);

            if (index >= 0) {
                selectedIndex = index;
            }
        } else if (addPolyPreview) {
            polygons.push(clonePolygon(addPolyPreview));
            polygons = polygons;
        }
    }

    /**
     * Every tool except the "select" tool cares about the mouse moving inside of the SVG. The
     * "move" tool will directly use this opportunity to update the coordinates of whatever
     * polygon (if any) we are currently dragging, while the rest of the tools (closest points,
     * and the polygon creation tools) will have their logic run by Svelte once we update the
     * current mouse coordinates.
     */
    function svgMouseMove(ev: MouseEvent): void {
        // This will trigger a reactive declaration for rendering closest points, etc.
        mouseCoordsInSVG = getMouseCoordinatesInSVG(ev);

        if (activeTool === "move") {
            if (draggingPolyIndex >= 0 && draggingPolyIndex < polygons.length) {
                const poly = polygons[draggingPolyIndex]!;
                const len = Math.min(draggingPolyCoordsRelativeToMouse.length, poly.length);
                const [mouseX, mouseY] = mouseCoordsInSVG;
                
                for (let i = 0; i < len; ++i) {
                    const pAbs = poly[i]!;
                    const pRel = draggingPolyCoordsRelativeToMouse[i]!;

                    pAbs[0] = pRel[0] + mouseX;
                    pAbs[1] = pRel[1] + mouseY;
                }

                // Trigger Svelte render
                polygons = polygons;
            }
        }
    }

    /**
     * When the mouse leaves the canvas, we should stop any drag operation, but also get rid of
     * any tool visuals like closest points and the mouse-following preview for adding a polygon.
     */
    function svgMouseLeave(ev: MouseEvent): void {
        draggingPolyIndex = -1;
        closestPoints = [];
        addPolyPreview = undefined;
        mouseCoordsInSVG = undefined;
    }
</script>

<!-- Svelte lets us reference the window declaratively from within components -->
<svelte:window on:keydown|capture={windowKeyDown} />

<main>

    <div
        id="main-toolbar"
        aria-label="Main toolbar"
        role="toolbar"
        aria-orientation="vertical">

        <button
            aria-label="Select"
            aria-keyshortcuts="1"
            aria-pressed={activeTool === "select"}
            on:click={() => activeTool = "select"}>
            <svg><use xlink:href="#cursor" /></svg>
            <kbd aria-hidden="true">1</kbd>
        </button>
        <button
            aria-label="Move"
            aria-keyshortcuts="2"
            aria-pressed={activeTool === "move"}
            on:click={() => activeTool = "move"}>
            <svg><use xlink:href="#move" /></svg>
            <kbd aria-hidden="true">2</kbd>
        </button>
        <button
            style="margin-bottom: 40px;"
            aria-label="Closest points"
            aria-keyshortcuts="3"
            aria-pressed={activeTool === "closest-points"}
            on:click={() => activeTool = "closest-points"}>
            <svg><use xlink:href="#closest-point" /></svg>
            <kbd aria-hidden="true">3</kbd>
        </button>

        <button
            aria-label="Triangle"
            aria-keyshortcuts="4"
            aria-pressed={activeTool === "triangle"}
            on:click={() => activeTool = "triangle"}>
            <svg><use xlink:href="#triangle" /></svg>
            <kbd aria-hidden="true">4</kbd>
        </button>
        <button
            aria-label="Square"
            aria-keyshortcuts="5"
            aria-pressed={activeTool === "square"}
            on:click={() => activeTool = "square"}>
            <svg><use xlink:href="#square" /></svg>
            <kbd aria-hidden="true">5</kbd>
        </button>
        <button
            aria-label="Hexagon"
            aria-keyshortcuts="6"
            aria-pressed={activeTool === "hexagon"}
            on:click={() => activeTool = "hexagon"}>
            <svg><use xlink:href="#hexagon" /></svg>
            <kbd aria-hidden="true">6</kbd>
        </button>

    </div>


    <!-- This visual interface is inherently keyboard inaccessible -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg
        id="canvas"
        xmlns="http://www.w3.org/2000/svg"
        class={activeTool}
        bind:this={svgEl}
        on:mousemove={svgMouseMove}
        on:mousedown={svgMouseDown}
        on:mouseup={svgMouseUp}
        on:click={svgMouseClick}
        on:mouseleave={svgMouseLeave}>

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
                points={addPolyPreview.map(([x, y]) => x + "," + y).join(" ")}
                pointer-events="none" />
        {/if}

    </svg>

</main>

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

        cursor: pointer;
    }
    button:hover {
        background-color: rgba(0, 0, 0, .12);
    }
    button[aria-pressed="true"] {
        background-color: #00E676;
    }
    button[aria-pressed="true"]:hover {
        background-color: #00C853;
    }
    button:focus,
    button:focus-visible {
        outline: 4px auto -webkit-focus-ring-color;
    }
    button:not(:first-child) {
        margin-top: var(--item-padding);
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

    #canvas.select polygon {
        cursor: pointer;
    }

    #canvas.move polygon {
        cursor: move;
    }

    #canvas.closest-points {
        cursor: crosshair;
    }
</style>
