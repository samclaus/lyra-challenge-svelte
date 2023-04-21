<script lang="ts">
    import { clonePolygon, closestPointOnSimplePolygonToTarget, type Point, type Polygon } from "./geometry";
    import Icon from "./Icon.svelte";

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

    /**
     * Writes the editor state to the console.
     */
    function saveEditorState(ev: MouseEvent): void {
        console.log(JSON.stringify(polygons, undefined, 4));
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
            <Icon d="M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.76,20.05 17.26,20.28L13.64,21.97Z" />
            <kbd aria-hidden="true">1</kbd>
        </button>
        <button
            aria-label="Move"
            aria-keyshortcuts="2"
            aria-pressed={activeTool === "move"}
            on:click={() => activeTool = "move"}>
            <Icon d="M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z" />
            <kbd aria-hidden="true">2</kbd>
        </button>
        <button
            aria-label="Closest points"
            aria-keyshortcuts="3"
            aria-pressed={activeTool === "closest-points"}
            on:click={() => activeTool = "closest-points"}>
            <Icon d="M6.45,17.45L1,12L6.45,6.55L7.86,7.96L4.83,11H19.17L16.14,7.96L17.55,6.55L23,12L17.55,17.45L16.14,16.04L19.17,13H4.83L7.86,16.04L6.45,17.45Z" />
            <kbd aria-hidden="true">3</kbd>
        </button>

        <div style="flex: 1; max-height: 40px;" />

        <button
            aria-label="Triangle"
            aria-keyshortcuts="4"
            aria-pressed={activeTool === "triangle"}
            on:click={() => activeTool = "triangle"}>
            <Icon d="M1,21H23L12,2" />
            <kbd aria-hidden="true">4</kbd>
        </button>
        <button
            aria-label="Square"
            aria-keyshortcuts="5"
            aria-pressed={activeTool === "square"}
            on:click={() => activeTool = "square"}>
            <Icon d="M3,3V21H21V3" />
            <kbd aria-hidden="true">5</kbd>
        </button>
        <button
            aria-label="Hexagon"
            aria-keyshortcuts="6"
            aria-pressed={activeTool === "hexagon"}
            on:click={() => activeTool = "hexagon"}>
            <Icon d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5Z" />
            <kbd aria-hidden="true">6</kbd>
        </button>

        <div style="flex: 1;" />

        <button
            aria-label="Save document"
            on:click={saveEditorState}>
            <Icon d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" />
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
    * {
        box-sizing: border-box;
    }

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

        background-color: #242424;
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
