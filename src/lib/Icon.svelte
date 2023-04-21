<script lang="ts">
    /**
     * Path data for the icon. See https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d.
     */
    export let d: string;
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden="true">
    <path {d} />
</svg>

<style>
    svg {
        display: block;
        width: 24px;
        height: 24px;
    }
</style>