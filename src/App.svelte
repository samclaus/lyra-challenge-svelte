<script lang="ts">
</script>

<main>
    <div
        id="main-toolbar"
        aria-label="Main toolbar"
        role="toolbar"
        aria-orientation="vertical">

    </div>
    <div id="canvas">

    </div>
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
