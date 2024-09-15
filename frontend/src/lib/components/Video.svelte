<script lang="ts">
	export let src = '';
	export let cssClass = '';
	export let autoplay = true;

	export let muted = true;
	let videoElement: HTMLVideoElement;

	function videoMouseOver() {
		muted = false;
		videoElement.volume = 1;
	}

	function videoMouseLeave() {
		muted = true;
		videoElement.volume = 0;
	}
</script>

<video
	class={cssClass}
	loop
	{autoplay}
	playsinline
	bind:this={videoElement}
	on:focus={() => {}}
	on:mouseover={videoMouseOver}
	on:mouseleave={videoMouseLeave}
	bind:muted
	{src}
>
	<track kind="captions" />
</video>
