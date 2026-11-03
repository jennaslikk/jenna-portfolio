<script>
 import ProjectPage from '#lib/components/project/ProjectPage.svelte';
 let { data } = $props();
</script>

<!-- Public pages and the private Studio preview use this exact renderer. -->
<ProjectPage {data} />
