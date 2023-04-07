<script lang="ts">
    import { onMount } from "svelte";
    import { closestPointOnSimplePolygonToTarget, type Point, type Polygon } from "./closest-point";
    import IconButton from "./ui/IconButton.svelte";
    import type { Unsubscriber } from "svelte/store";

    let polygons: Polygon[] = [];
    let closestPoints: Point[] = [];
    let svgEl: SVGElement;
    let svgWidth: number;
    let svgHeight: number;
    let mouseLoc: Point = [0, 0];
    let counter = 0;

    // TODO
    //
    // Svelte supports bind:clientWidth and bind:clientHeight (and a couple others) to trivially
    // watch the size of an element with just a couple lines of code, not to mention the reactive
    // stuff gets cleaned up automatically when the component is destroyed, but..
    //
    // Unfortunately, those bindings were implemented before the ResizeObserver API was widely
    // supported, and they work using a hack that involves adding an <iframe> as a child of the
    // observed element, meaning we cannot use them for an <svg> element directly, not to mention
    // worse performance than the ResizeObserver API (although that is irrelevant in this simple
    // scenario). I could have wrapped the <svg> canvas in a <div>, but I decided that was more
    // convoluted than just using a ResizeObserver manually with the Svelte onMount API.
    //
    // See https://github.com/sveltejs/svelte/issues/7583
    onMount((): Unsubscriber => {
        const obs = new ResizeObserver(entries => {
            for (const { contentBoxSize: [size] } of entries) {
                console.log(size.inlineSize, size.blockSize);
            }
        });
        obs.observe(svgEl);
        return () => obs.disconnect(); // Svelte will call this when the component is destroyed
    });

    function getRandomIntCoords(): Point {
        const { width, height } = svgEl.getBoundingClientRect();

        return [
            Math.round(Math.random() * width),
            Math.round(Math.random() * height),
        ];
    }

    function addTriangle(ev: MouseEvent): void {
        const [x, y] = getRandomIntCoords();

        polygons.push([
            [x, y],
            [x + 30, y + 45],
            [x - 30, y + 45],
        ]);

        // Svelte reactivity is based on assignments; it will remove this no-op
        polygons = polygons;
    }

    function addSquare(ev: MouseEvent): void {
        const [x, y] = getRandomIntCoords();

        polygons.push([
            [x, y],
            [x + 50, y],
            [x + 50, y + 50],
            [x, y + 50],
        ]);

        // Svelte reactivity is based on assignments; it will remove this no-op
        polygons = polygons;
    }

    function addHexagon(ev: MouseEvent): void {
        const [x, y] = getRandomIntCoords();
        const poly: Polygon = [
            [x + 30, y + 0],
            [x + 15, y + 26],
            [x + -15, y + 26],
            [x + -30, y + 0],
            [x + -15, y + -26],
            [x + 15, y + -26],
        ];

        polygons.push(poly);

        // Svelte reactivity is based on assignments; it will remove this no-op
        polygons = polygons;
    }

    function onMouseMove(ev: MouseEvent): void {
        // const rect = svgEl.getBoundingClientRect();

        // mouseLoc = [
        //     (ev.clientX - rect.left) / rect.width * 100,
        //     (ev.clientY - rect.top) / rect.height * 100,
        // ];
        // closestPoints = polygons.map(
        //     poly => closestPointOnSimplePolygonToTarget(poly, mouseLoc),
        // );
        // counter += 1;
    }

    function onClick(ev: MouseEvent): void {
        const { left, top } = svgEl.getBoundingClientRect();

        closestPoints.push([ev.clientX - left, ev.clientY - top]);
        closestPoints = closestPoints;
    }
</script>

<main>

    <div
        id="main-toolbar"
        aria-label="Main toolbar"
        role="toolbar"
        aria-orientation="vertical">

        <IconButton label="Select" icon="cursor" />
        <IconButton label="Move" icon="move" />
        <IconButton label="Closest point" icon="closest-point" />

        <IconButton label="Triangle" icon="triangle" on:click={addTriangle} />
        <IconButton label="Square" icon="square" on:click={addSquare} />
        <IconButton label="Hexagon" icon="hexagon" on:click={addHexagon} />

    </div>


    <!-- Sorry Svelte, this element is not keyboard accessible -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg
        id="canvas"
        viewBox="0 0 {svgWidth} {svgHeight}"
        xmlns="http://www.w3.org/2000/svg"
        bind:this={svgEl}
        on:mousemove={onMouseMove}
        on:click={onClick}>
        {#each polygons as poly}
            <polygon
                fill="#E53935"
                stroke="#00897B"
                stroke-width="3"
                points={poly.map(([x, y]) => x + "," + y).join(" ")} />
        {/each}
        {#each closestPoints as [x, y]}
            <circle cx={x} cy={y} r="5" fill="red" />
        {/each}
    </svg>

</main>

<style>
    main {
        width: 100%;
        height: 100%;

        display: flex;
    }

    #main-toolbar {
        min-width: 80px;

        display: flex;
        flex-direction: column;
        align-items: center;

        background-color: white;
        color: black;
    }

    #canvas {
        flex: 1 0 0;
        height: 100%;
    }
</style>
