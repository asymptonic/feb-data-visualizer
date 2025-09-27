<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import { scaleUtc } from 'd3-scale';
	import { curveStepAfter } from 'd3-shape';
	import { AreaChart, Spline, Svg } from 'layerchart';
	import { data } from './data.svelte';
	import dayjs from 'dayjs';

	const chartConfig = {
		power: { label: 'Torque', color: 'var(--chart-1)', icon: ActivityIcon }
	} satisfies Chart.ChartConfig;
</script>

{#if data.datasets['aero_lap_data_jebrfrd4t0.csv']}
	<Chart.Container config={chartConfig}>
		<AreaChart
			data={data.datasets['aero_lap_data_jebrfrd4t0.csv'].datapoints.map((point) => ({
				timestamp: point.TimeStamp,
				power: point.D1_Commanded_Torque
			}))}
			x="timestamp"
			xScale={scaleUtc()}
			series={[
				{
					key: 'power',
					label: 'Power',
					color: chartConfig.power.color
				}
			]}
			seriesLayout="stack"
			props={{
				area: {
					curve: curveStepAfter,
					'fill-opacity': 0.4,
					line: { class: 'stroke-1' },
					motion: 'tween'
				},
				xAxis: {
					format: (v: number) => dayjs(v * 1000).format('HH:mm:ss')
				},
				yAxis: { format: () => '' }
			}}
		>
			{#snippet tooltip()}
				<Chart.Tooltip hideLabel />
			{/snippet}
		</AreaChart>
	</Chart.Container>
{/if}
