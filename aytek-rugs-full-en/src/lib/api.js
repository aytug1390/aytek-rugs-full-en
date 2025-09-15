export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_ADMIN_API || "http://localhost:5000";

export async function api(path, opts = {}) {
	const res = await fetch(`${API_BASE}${path}`, {
		...opts,
		cache: "no-store",
		headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
	});
	const contentType = res.headers.get("content-type") || "";
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`API ${path} ${res.status}: ${text}`);
	}
	if (!contentType.includes("application/json")) {
		const text = await res.text().catch(() => "");
		throw new Error(`API ${path} did not return JSON. Response: ${text}`);
	}
	return res.json().catch(() => ({}));
}
