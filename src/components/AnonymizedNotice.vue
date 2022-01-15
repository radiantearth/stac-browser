<template>
	<b-alert variant="warning" show>
		<strong>Anonymized</strong>&nbsp;
		<small>{{ warning }}</small>
	</b-alert>
</template>

<script>
export default {
	name: 'DeprecationNotice',
	props: {
		warning: {
			type: String,
			required: true
		}
	}
}
</script>