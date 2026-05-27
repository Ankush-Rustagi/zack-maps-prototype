export type EventBadge = 'Active' | 'Recent' | null;

export interface EventData {
  key: string;
  title: string;
  badge: EventBadge;
  subtitle: string;
  cam: string;
  type: string;
  severity: string;
  status: string;
  when: string;
  source: string;
  linked: string;
  place: string;
}

export const EVENT_DATA: Record<string, EventData> = {
  'door-forced': {
    key: 'door-forced',
    title: 'Door forced open',
    badge: 'Active',
    subtitle: 'HQ › Main Bldg › Floor 2 › Lobby · 3 min ago',
    cam: 'Cam-Lobby-01',
    type: 'Door forced open',
    severity: 'High',
    status: 'Active · unacknowledged',
    when: 'Today · 9:42 AM',
    source: 'Door-Lobby-N1',
    linked: 'Cam-Lobby-01',
    place: 'HQ › Main Bldg › Floor 2 › Lobby',
  },
  'after-hours': {
    key: 'after-hours',
    title: 'After-hours motion',
    badge: 'Recent',
    subtitle: 'Warehouse A › Dock 4 · 17 min ago',
    cam: 'Cam-Dock-04',
    type: 'Motion in restricted zone',
    severity: 'Medium',
    status: 'Recent · auto-cleared',
    when: 'Today · 9:28 AM',
    source: 'Motion-Dock-04',
    linked: 'Cam-Dock-04',
    place: 'Warehouse A › Building 1 › Floor 1 › Dock 4',
  },
  'unlock-remote': {
    key: 'unlock-remote',
    title: 'Remote Unlock',
    badge: null,
    subtitle: 'Railroad Kitchen Door · 12/12/2022 6:25 AM',
    cam: 'Cam-Entrance-04',
    type: 'Remote unlock',
    severity: 'Info',
    status: 'Completed',
    when: '12/12/2022 · 6:25 AM',
    source: 'Railroad Kitchen Door',
    linked: 'Cam-Entrance-04',
    place: 'Retail › Palo Alto › Storefront',
  },
  'lockdown': {
    key: 'lockdown',
    title: 'Lockdown Activated',
    badge: null,
    subtitle: 'Railroad Kitchen Door · 12/12/2022 6:25 AM',
    cam: 'Cam-Entrance-04',
    type: 'Lockdown activated',
    severity: 'High',
    status: 'Resolved',
    when: '12/12/2022 · 6:25 AM',
    source: 'Railroad Kitchen Door',
    linked: 'Cam-Entrance-04',
    place: 'Retail › Palo Alto › Storefront',
  },
};

export type EventOrigin = 'device' | 'alerts' | null;
