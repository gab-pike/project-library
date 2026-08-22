// Tailwind v4 scans source text for literal class names, so these must stay as full
// literal strings (no `bg-ctp-${color}` interpolation) for the utilities to be generated.
const CATEGORY_ACCENTS: Record<string, string> = {
	mauve: 'text-ctp-mauve',
	pink: 'text-ctp-pink',
	peach: 'text-ctp-peach',
	green: 'text-ctp-green',
	yellow: 'text-ctp-yellow',
	blue: 'text-ctp-blue',
	teal: 'text-ctp-teal',
	red: 'text-ctp-red',
	lavender: 'text-ctp-lavender'
};

export function categoryAccentClass(color: string | null | undefined): string {
	return (color && CATEGORY_ACCENTS[color]) || 'text-ctp-subtext1';
}

const STATUS_BADGES: Record<string, string> = {
	idea: 'bg-ctp-blue/15 text-ctp-blue',
	active: 'bg-ctp-green/15 text-ctp-green',
	paused: 'bg-ctp-peach/15 text-ctp-peach',
	completed: 'bg-ctp-lavender/15 text-ctp-lavender',
	archived: 'bg-ctp-overlay0/15 text-ctp-overlay1'
};

export function statusBadgeClass(status: string): string {
	return STATUS_BADGES[status] ?? STATUS_BADGES.archived;
}

const STATUS_BORDERS: Record<string, string> = {
	idea: 'border-l-ctp-blue',
	active: 'border-l-ctp-green',
	paused: 'border-l-ctp-peach',
	completed: 'border-l-ctp-lavender',
	archived: 'border-l-ctp-overlay0'
};

// Paused projects are first-class, not buried — a colored left border keeps them
// visually distinct in the library grid even at a glance, not just via the badge text.
export function statusBorderClass(status: string): string {
	return STATUS_BORDERS[status] ?? STATUS_BORDERS.archived;
}

const PRIORITY_BADGES: Record<string, string> = {
	high: 'text-ctp-red',
	medium: 'text-ctp-yellow',
	low: 'text-ctp-overlay1'
};

export function priorityClass(priority: string): string {
	return PRIORITY_BADGES[priority] ?? PRIORITY_BADGES.low;
}
