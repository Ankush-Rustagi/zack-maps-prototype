export type StateId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I'
  | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'T'
  | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export interface StateDef {
  id: StateId;
  name: string;
  desc: string;
}

export const STATES: StateDef[] = [
  { id: 'A', name: 'Null state',         desc: 'Default view. Rail always visible. Toolbar (search + filter + alerts) top-left.' },
  { id: 'B', name: 'Rail default',       desc: 'Same as null state — rail is always visible. No hamburger needed.' },
  { id: 'C', name: 'Recents flyout',     desc: 'Recents list flyout, filterable, same shape as other lists.' },
  { id: 'D', name: 'Locations flyout',   desc: 'Locations list with filter chips + free-text. Site context strip on top.' },
  { id: 'E', name: 'Collections flyout', desc: 'Collections list. Same shape as Locations.' },
  { id: 'F', name: 'Files flyout',       desc: 'Files list with drag-to-canvas affordance for first-time builders.' },
  { id: 'G', name: 'Place selected',     desc: 'Place card pinned bottom-right. "Open in Editor" is the only entry to editor mode.' },
  { id: 'H', name: 'Editor entry',       desc: 'Viewer → Editor handoff. Confirmation modal with pulsing CTA.' },
  { id: 'I', name: 'Editor',             desc: 'Editor toolbelt (left) + selection aside (right) + top bar. Viewer rail and toolbar are hidden.' },
  { id: 'J', name: 'Search active',      desc: 'Toolbar search activated. Results dropdown below. Site scope is read-only context.' },
  { id: 'K', name: 'Site picker',        desc: 'Filter icon clicked in toolbar. Site picker opens below the funnel button.' },
  { id: 'L', name: 'File dropzone',      desc: 'Files flyout open. Dropzone at top of list. Path A flow.' },
  { id: 'M', name: 'Place + drag',       desc: 'Place card open. Browser detects dragover. Drop hint over map. Path B.' },
  { id: 'N', name: 'File attaching',     desc: 'Post-drop. Progress card + alignment prompt over the map.' },
  { id: 'O', name: 'Collection detail',  desc: 'Inside a Collection. Children render as a flat nav list.' },
  { id: 'P', name: 'Settings',           desc: 'User + Org Admin settings, scoped tabs. Reachable from Account avatar and toolbelt gear.' },
  { id: 'Q', name: 'Device detail',      desc: 'Single device clicked. Camera footage, status, schedule, recent events.' },
  { id: 'R', name: 'Event detail',       desc: 'Alert or event clicked. Camera + metadata. Back button if drilled from a device.' },
  { id: 'T', name: 'Empty data',         desc: 'Seed mode = empty. No locations or devices anywhere. The Add location button + flyouts are still available — empty world emerges from empty data, not a modal.' },
  { id: 'U', name: 'Cluster overview',   desc: 'Zoomed-out world view. Each location is a cluster token; close locations aggregate into one. Default landing.' },
  { id: 'V', name: 'Location view',      desc: 'Zoomed into one location. Layout overlay + device tokens. Right panel shows floor dropdown + devices tab.' },
  { id: 'W', name: 'Address pinned',     desc: 'Address selected; pin dropped. Prompt invites the user to define a perimeter for a new location.' },
  { id: 'X', name: 'Drawing perimeter',  desc: 'Polygon-draw mode. Click vertices, double-click to close. Confirm or cancel.' },
  { id: 'Y', name: 'Attach layout',      desc: 'Perimeter saved. User chooses to upload a new layout or pick one from Files.' },
  { id: 'Z', name: 'Orient layout',      desc: 'Layout image overlaid in screen space. Manual / Scale / Anchor modes + opacity & bearing sliders + Save.' },
];

export const FLYOUT_STATES: StateId[] = ['C', 'D', 'E', 'F', 'L', 'O'];
