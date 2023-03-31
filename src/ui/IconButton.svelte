<script lang="ts">
    /**
     * Text label for accessibility.
     */
    export let label: string;
    /**
     * ID of the SVG icon symbol to use. Refer to the inline SVG icon sheet
     * in index.html to see options.
     */
    export let icon: string;
</script>

<button on:click aria-label={label}>
    <svg>
        <use xlink:href="#{icon}" />
    </svg>
</button>

<style>
    button {
        margin: 0;
        padding: 8px;

        background-color: transparent;
        border: 1px solid black;
        border-radius: 4px;
    }

    svg {
        display: block;
        width: 24px;
        height: 24px;
        line-height: 24px;
    }
</style>