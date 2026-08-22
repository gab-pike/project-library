const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 60 * 60 * 24 * 365],
	['month', 60 * 60 * 24 * 30],
	['week', 60 * 60 * 24 * 7],
	['day', 60 * 60 * 24],
	['hour', 60 * 60],
	['minute', 60]
];

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function relativeTime(iso: string): string {
	const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
	for (const [unit, secondsPerUnit] of UNITS) {
		if (Math.abs(seconds) >= secondsPerUnit) {
			return rtf.format(Math.round(seconds / secondsPerUnit), unit);
		}
	}
	return rtf.format(Math.round(seconds), 'second');
}

// Search snippets come from arbitrary user-entered text, so they're never rendered via {@html} —
// this splits on the '**'-delimited highlight markers into plain segments Svelte can interpolate
// safely (auto-escaped), with the odd-indexed segments wrapped in <mark> by the caller.
export function splitSnippet(snippet: string): { text: string; hit: boolean }[] {
	return snippet.split('**').map((text, i) => ({ text, hit: i % 2 === 1 }));
}
