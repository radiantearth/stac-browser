<template>
	<b-alert variant="warning" show>
		<strong>Deprecated</strong>&nbsp;
		<small>Please note that this {{ type }} is deprecated with the potential to be removed in any of the next versions. It should be transitioned out of usage as soon as possible. Refrain from using it in new projects.</small>
	</b-alert>
</template>

<script>
export default {
	name: 'DeprecationNotice',
	props: {
		type: {
			type: String,
			default: ""
		}
	}
}
</script>