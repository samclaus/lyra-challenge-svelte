<script lang="ts">
    import type { Polygon } from "./closest-point";
    import IconButton from "./ui/IconButton.svelte";

    let polygons: Polygon[] = [];

    function addTriangle(ev: MouseEvent): void {
        const x = Math.round(Math.random() * 100);
        const y = Math.round(Math.random() * 100);

        polygons.push([
            [x, y],
            [x + 9, y + 12],
            [x - 9, y + 12],
        ]);

        // Svelte reactivity is based on assignments; it will remove this no-op
        polygons = polygons;
    }

    function addSquare(ev: MouseEvent): void {
        const x = Math.round(Math.random() * 100);
        const y = Math.round(Math.random() * 100);

        polygons.push([
            [x, y],
            [x + 12, y],
            [x + 12, y + 12],
            [x, y + 12],
        ]);

        // Svelte reactivity is based on assignments; it will remove this no-op
        polygons = polygons;
    }

    function addHexagon(ev: MouseEvent): void {
        const x = Math.round(Math.random() * 100);
        const y = Math.round(Math.random() * 100);
        const poly: Polygon = [
            [x + 10, y + 0],
            [x + 5, y + 8.66],
            [x + -5, y + 8.66],
            [x + -10, y + 0],
            [x + -5, y + -8.66],
            [x + 5, y + -8.66],
        ];

        polygons.push(poly);

        // Svelte reactivity is based on assignments; it will remove this no-op
        polygons = polygons;
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
    <svg id="canvas" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {#each polygons as p}
            <polygon stroke="blue" fill="red" points={p.map(([x, y]) => x + "," + y).join(" ")} />
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
    }

    #canvas {
        flex: 1 0 0;
    }
</style>
