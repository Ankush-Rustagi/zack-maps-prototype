import { useStore } from '../../store';
import { PolygonDrawer } from '../Polygon/PolygonDrawer';

/**
 * Crop sub-mode for the layout editor. Wraps the generic PolygonDrawer with
 * the editingLayout.crop slot.
 */
export function CropDraw() {
  const editing = useStore((s) => s.editingLayout);
  const update = useStore((s) => s.updateEditingLayout);
  if (!editing) return null;

  return (
    <PolygonDrawer
      value={editing.crop}
      onChange={(polygon) => update({ crop: polygon })}
      color="#22c55e"
      idPrefix="crop-draw"
    />
  );
}
