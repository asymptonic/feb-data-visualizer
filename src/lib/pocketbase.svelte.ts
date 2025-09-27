import PocketBase, { type RecordModel } from 'pocketbase';
import { PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';
import type { Collections, TypedPocketBase } from './types/db';
import { goto } from '$app/navigation';

export const pb = new PocketBase(PUBLIC_API_URL) as TypedPocketBase;

export const user = $state({ record: pb.authStore.record });

pb.authStore.onChange((auth) => {
	user.record = pb.authStore.record;
	exportAuthStoreToCookie();
});

function exportAuthStoreToCookie() {
	if (!browser) return;
	try {
		document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
	} catch {}
}

export function logOut() {
	pb.authStore.clear();
	eraseCookie('pb_auth');
}

export function eraseCookie(name: string) {
	document.cookie = name + '=; Max-Age=-99999999;';
}

export async function userRefresh() {
	try {
		if (pb.authStore.isValid) await pb.collection('users').authRefresh();
	} catch {
		logOut();
	}
}

export function fetchRecord<T>(fetcher: Promise<T> | (() => Promise<T>)) {
	const state = $state<{ record: T | null }>({ record: null });

	(typeof fetcher === 'function' ? fetcher() : fetcher).then((r) => (state.record = r));

	return state;
}

let listSubscriptions = $state<{ [key: string]: any }>({});

export function useList<T = RecordModel>(
	collection: string,
	options?: { filter?: string; expand?: string; [x: string]: any }
) {
	const key = `${collection}:${JSON.stringify(options)}`;
	if (listSubscriptions[key]) {
		return listSubscriptions[key] as { records: T[] };
	} else {
		const state = $state<{ records: T[] }>({ records: [] });

		$effect(() => {
			pb.collection(collection)
				.getFullList(options)
				.then((r) => {
					state.records = r as T[];

					pb.collection(collection).subscribe(
						'*',
						(e) => {
							if (e.action === 'create') {
								state.records.unshift(e.record as T);
							} else {
								// @ts-expect-error
								const index = state.records.findIndex((i) => i.id === e.record.id);

								if (e.action === 'update') {
									if (index >= 0) state.records[index] = e.record as T;
								} else if (e.action === 'delete') {
									state.records.splice(index, 1);
								}
							}
						},
						options
					);
				});
			// return () => pb.collection('collection').unsubscribe('*');
		});

		listSubscriptions[key] = state;

		return state;
	}
}

let recordSubscriptions = $state<{ [key: string]: any }>({});

export function useRecord<T = RecordModel>(
	collection: string,
	id: string,
	options?: { expand?: string; [x: string]: any }
) {
	const key = `${collection}:${JSON.stringify(options)}`;
	if (recordSubscriptions[key]) {
		return recordSubscriptions[key] as { record: T | null };
	} else {
		const state = $state<{ record: T | null }>({ record: null });

		$effect(() => {
			pb.collection(collection)
				.getOne(id, options)
				.then((r) => {
					state.record = r as T;

					pb.collection(collection).subscribe(
						id,
						(e) => {
							if (e.action === 'update') {
								state.record = e.record as T;
							} else if (e.action === 'delete') {
								state.record = null;
							}
						},
						options
					);
				});
		});

		recordSubscriptions[key] = state;

		return state;
	}
}
