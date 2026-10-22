const PASS_STORAGE_KEY = "tailpad-pass";

function getToken() {
	return sessionStorage.getItem(PASS_STORAGE_KEY) ?? "";
}

export async function api<T = any>(
	path: string,
	opts: RequestInit = {},
): Promise<T> {
	const res = await fetch(path, {
		...opts,
		headers: {
			...(opts.headers ?? {}),
			Authorization: "Bearer " + getToken(),
		},
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok || data?.err) throw new Error(data?.msg ?? `HTTP ${res.status}`);
	return data?.data as T;
}
