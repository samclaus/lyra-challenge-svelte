<script>import { clonePolygon, closestPointOnSimplePolygonToTarget } from "./geometry";
const KEY_TO_TOOL = {
  1: "select",
  2: "move",
  3: "closest-points",
  4: "triangle",
  5: "square",
  6: "hexagon"
};
const BASE_POLYGONS = {
  triangle: [
    [30, 0],
    [60, 45],
    [0, 45]
  ],
  square: [
    [0, 0],
    [50, 0],
    [50, 50],
    [0, 50]
  ],
  hexagon: [
    [60, 26],
    [45, 52],
    [15, 52],
    [0, 26],
    [15, 0],
    [45, 0]
  ]
};
let activeTool = "triangle";
let addPolyPreview;
let polygons = [];
let closestPoints = [];
let svgEl;
let selectedIndex = -1;
let mouseCoordsInSVG;
let draggingPolyIndex = -1;
let draggingPolyCoordsRelativeToMouse = [];
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
$:
  if (mouseCoordsInSVG) {
    const [mouseX, mouseY] = mouseCoordsInSVG;
    const _captureCoords = mouseCoordsInSVG;
    closestPoints = activeTool === "closest-points" ? polygons.map(
      (poly) => closestPointOnSimplePolygonToTarget(poly, _captureCoords)
    ) : [];
    addPolyPreview = BASE_POLYGONS[activeTool]?.map(
      ([x, y]) => [x + mouseX, y + mouseY]
    );
  } else {
    addPolyPreview = void 0;
    closestPoints = [];
  }
function getMouseCoordinatesInSVG(ev) {
  const { top, left } = svgEl.getBoundingClientRect();
  return [ev.clientX - left, ev.clientY - top];
}
function getPolygonIndexForElement(el) {
  if (el instanceof SVGPolygonElement) {
    const index = +el.dataset.index;
    if (Number.isSafeInteger(index)) {
      return index;
    }
  }
  return -1;
}
function windowKeyDown(ev) {
  if (!ev.metaKey && !ev.shiftKey) {
    const tool = KEY_TO_TOOL[ev.key];
    if (tool) {
      ev.preventDefault();
      ev.stopPropagation();
      activeTool = tool;
    }
  }
}
function svgMouseDown(ev) {
  if (activeTool === "move") {
    const index = getPolygonIndexForElement(ev.target);
    if (index >= 0 && index < polygons.length) {
      const poly = polygons[index];
      const [mouseX, mouseY] = getMouseCoordinatesInSVG(ev);
      draggingPolyIndex = index;
      draggingPolyCoordsRelativeToMouse = poly.map(
        // NOTE: it is important that we make a DEEP copy of this polygon
        ([x, y]) => [x - mouseX, y - mouseY]
      );
    }
  }
}
function svgMouseUp(ev) {
  draggingPolyIndex = -1;
}
function svgMouseClick(ev) {
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
function svgMouseMove(ev) {
  mouseCoordsInSVG = getMouseCoordinatesInSVG(ev);
  if (activeTool === "move") {
    if (draggingPolyIndex >= 0 && draggingPolyIndex < polygons.length) {
      const poly = polygons[draggingPolyIndex];
      const len = Math.min(draggingPolyCoordsRelativeToMouse.length, poly.length);
      const [mouseX, mouseY] = mouseCoordsInSVG;
      for (let i = 0; i < len; ++i) {
        const pAbs = poly[i];
        const pRel = draggingPolyCoordsRelativeToMouse[i];
        pAbs[0] = pRel[0] + mouseX;
        pAbs[1] = pRel[1] + mouseY;
      }
      polygons = polygons;
    }
  }
}
function svgMouseLeave(ev) {
  draggingPolyIndex = -1;
  closestPoints = [];
  addPolyPreview = void 0;
  mouseCoordsInSVG = void 0;
}
function saveEditorState(ev) {
  console.log(JSON.stringify(polygons, void 0, 4));
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
            aria-label="Closest points"
            aria-keyshortcuts="3"
            aria-pressed={activeTool === "closest-points"}
            on:click={() => activeTool = "closest-points"}>
            <svg><use xlink:href="#closest-point" /></svg>
            <kbd aria-hidden="true">3</kbd>
        </button>

        <div style="flex: 1; max-height: 40px;" />

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

        <div style="flex: 1;" />

        <button
            aria-label="Save document"
            on:click={saveEditorState}>
            <svg><use xlink:href="#export" /></svg>
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
