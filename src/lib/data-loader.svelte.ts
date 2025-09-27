import Papa from 'papaparse';
import { pb } from './pocketbase.svelte';
import type { FilesResponse } from './types/db';
import ky from 'ky';
import { toast } from 'svelte-sonner';

export type Datapoint = {
	'': number;
	TimeStamp: number;
	D1_Commanded_Torque: number;
	D1_DC_Bus_Voltage: number;
	D2_Motor_Speed: number;
	IVT_Result_I: number;
	Wheel_Speed: number;
	Power: number;
	Incremental_Energy: number;
	Total_Energy: number;
	adjusted_time_ms: number;
	time_on_video: string;
};

export type DataStore = {
	datasets: {
		[id: string]:
			| {
					id: string;
					name: string;
					fileName: string;
					datapoints: Datapoint[];
			  }
			| 'fetching' | 'missing';
	};
};

export const data: DataStore = $state({
	datasets: {}
});

export async function loadUploadedCSV(fileid: string) {
	data.datasets[fileid] = 'fetching';

	const fileRecord = await pb
		.collection('files')
		.getOne(fileid)
		.catch((e) => {
			toast.error(JSON.stringify(e));
			return undefined;
		});
	if (!fileRecord) return data.datasets[fileid] = 'missing';;

	const csvString = await ky(pb.files.getURL(fileRecord, fileRecord.file)).text();
	const { data: parsedCSV, errors } = Papa.parse<Datapoint>(csvString, { header: true });
	// if (errors) return toast.error(JSON.stringify(errors));

	data.datasets[fileRecord.id] = {
		id: fileRecord.id,
		name: fileRecord.name,
		fileName: fileRecord.file,
		datapoints: parsedCSV
	};
}
