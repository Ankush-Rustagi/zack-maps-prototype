import { useEffect, useMemo, useState } from 'react';
import { Source, Layer, Marker, useMap } from 'react-map-gl/mapbox';
import type { FeatureCollection, Point } from 'geojson';
import { useStore } from '../../store';
import { ClusterToken } from './ClusterToken';
import { PendingPin } from './PendingPin';

/** GeoJSON properties carried per location-point feature. */
interface LocProps {
  id: string;
  name: string;
  deviceCount: number;
  onlineCount: number;
}

const SOURCE_ID = 'locations';

interface RenderedFeature {
  id: number | string;
  lng: number;
  lat: number;
  pointCount: number;
  deviceCount: number;
  onlineCount: number;
  clusterId?: number;
  locationId?: string;
}

/**
 * Owns the GeoJSON cluster source for `LOCATIONS` and renders one HTML marker
 * per visible feature (cluster OR individual location). Mirrors the
 * `cluster-html` Mapbox example pattern.
 *
 * Single-location clicks → store.selectLocation(id) (which routes to V).
 * Cluster clicks → getClusterExpansionZoom + easeTo to break the cluster.
 */
export function ClusterLayer() {
  const { current: map } = useMap();
  const selectLocation = useStore((s) => s.selectLocation);
  const locations = useStore((s) => s.locations);
  const hoverLocationId = useStore((s) => s.hoverLocationId);
  const draftPin = useStore((s) => s.draftPin);
  const [features, setFeatures] = useState<RenderedFeature[]>([]);

  // Only configured locations participate in cluster aggregation; pending
  // locations render as standalone PendingPin markers below.
  const configured = useMemo(() => locations.filter((l) => l.setupStatus === 'configured'), [locations]);
  const pending = useMemo(() => locations.filter((l) => l.setupStatus === 'pending'), [locations]);

  // GeoJSON for the cluster source rebuilds whenever the configured set changes.
  const data = useMemo<FeatureCollection<Point, LocProps>>(() => ({
    type: 'FeatureCollection',
    features: configured.map((l) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
      properties: {
        id: l.id,
        name: l.name,
        deviceCount: l.deviceCount,
        onlineCount: l.onlineCount,
      },
    })),
  }), [configured]);

  // Sync rendered markers whenever the map renders or moves. Uses the same
  // pattern as the official mapbox cluster-html example: poll `render` and
  // bail out when the source isn't loaded yet.
  useEffect(() => {
    if (!map) return;
    const mb = map.getMap();

    function refresh() {
      if (!mb.getSource(SOURCE_ID)) return;
      if (!mb.isSourceLoaded(SOURCE_ID)) return;
      const raw = mb.querySourceFeatures(SOURCE_ID);
      const seen = new Set<string>();
      const out: RenderedFeature[] = [];
      for (const f of raw) {
        const geo = f.geometry;
        if (!geo || geo.type !== 'Point') continue;
        const [lng, lat] = geo.coordinates as [number, number];
        const props = f.properties as Record<string, unknown> | null;
        if (!props) continue;
        const isCluster = Boolean(props.cluster);
        if (isCluster) {
          const clusterId = props.cluster_id as number;
          const key = `c-${clusterId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            id: key,
            lng, lat,
            pointCount: (props.point_count as number) ?? 0,
            deviceCount: (props.deviceCount as number) ?? 0,
            onlineCount: (props.onlineCount as number) ?? 0,
            clusterId,
          });
        } else {
          const locationId = props.id as string;
          const key = `l-${locationId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            id: key,
            lng, lat,
            pointCount: 1,
            deviceCount: (props.deviceCount as number) ?? 0,
            onlineCount: (props.onlineCount as number) ?? 0,
            locationId,
          });
        }
      }
      setFeatures((prev) => {
        // Cheap stable check to avoid React re-renders when features didn't move.
        if (prev.length === out.length && prev.every((p, i) => p.id === out[i].id && p.lng === out[i].lng && p.lat === out[i].lat)) {
          return prev;
        }
        return out;
      });
    }

    mb.on('render', refresh);
    mb.on('move', refresh);
    // First paint in case render won't fire (e.g. tab not visible).
    refresh();

    return () => {
      mb.off('render', refresh);
      mb.off('move', refresh);
    };
  }, [map]);

  function handleClick(f: RenderedFeature, e: React.MouseEvent) {
    e.stopPropagation();
    if (f.locationId) {
      selectLocation(f.locationId);
      return;
    }
    if (f.clusterId != null && map) {
      const mb = map.getMap();
      const src = mb.getSource(SOURCE_ID) as unknown as {
        getClusterExpansionZoom?: (id: number, cb: (err: Error | null, z: number) => void) => void;
      };
      src.getClusterExpansionZoom?.(f.clusterId, (err, zoom) => {
        if (err) return;
        mb.easeTo({ center: [f.lng, f.lat], zoom });
      });
    }
  }

  return (
    <>
      <Source
        id={SOURCE_ID}
        type="geojson"
        data={data}
        cluster
        clusterRadius={60}
        clusterMaxZoom={13}
        clusterProperties={{
          deviceCount: ['+', ['get', 'deviceCount']],
          onlineCount: ['+', ['get', 'onlineCount']],
        }}
      >
        {/* Invisible layer to force the source to render — querySourceFeatures
            returns nothing for GeoJSON sources that no layer references. */}
        <Layer id="cluster-anchor" type="circle" paint={{ 'circle-radius': 0, 'circle-opacity': 0 }} />
      </Source>
      {features.map((f) => {
        const highlighted = f.locationId != null && f.locationId === hoverLocationId;
        return (
          <Marker
            key={f.id}
            longitude={f.lng}
            latitude={f.lat}
            anchor="center"
            onClick={(ev) => handleClick(f, ev.originalEvent as unknown as React.MouseEvent)}
          >
            <ClusterToken
              total={f.deviceCount}
              online={f.onlineCount}
              pointCount={f.pointCount}
              highlighted={highlighted}
            />
          </Marker>
        );
      })}
      {/* Pending locations skip the GeoJSON source entirely. */}
      {pending.map((l) => (
        <Marker
          key={`pending-${l.id}`}
          longitude={l.lng}
          latitude={l.lat}
          anchor="bottom"
          onClick={(ev) => {
            (ev.originalEvent as unknown as MouseEvent).stopPropagation();
            selectLocation(l.id);
          }}
        >
          <PendingPin highlighted={l.id === hoverLocationId} />
        </Marker>
      ))}
      {/* Preview pin shown while the user is naming a new location. */}
      {draftPin && (
        <Marker
          key="draft-pin"
          longitude={draftPin.lng}
          latitude={draftPin.lat}
          anchor="bottom"
        >
          <PendingPin preview />
        </Marker>
      )}
    </>
  );
}
