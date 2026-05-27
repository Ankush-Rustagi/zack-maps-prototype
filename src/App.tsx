import { CommandBar } from './components/CommandBar';
import { NavRail } from './components/NavRail';
import { MapView } from './components/MapView';
import { Toolbar } from './components/Toolbar';
import { StatesSidebar } from './components/StatesSidebar';
import { LayersUi } from './components/LayersUi';
import { Flyouts } from './components/Flyouts';
import { RightPanels } from './components/RightPanels';
import { Editor } from './components/Editor';
import { Settings } from './components/Settings';
import { CreateLocationPopover } from './components/CreateLocationPopover';
import { LayoutEditor } from './components/LayoutEditor/LayoutEditor';
import { FloorplanDOMOverlay } from './components/Map/FloorplanDOMOverlay';
import { useStore } from './store';

export default function App() {
  const topBarVisible = useStore((s) => s.topBarVisible);
  const curState = useStore((s) => s.curState);
  // Z (layout editor) and X (perimeter draw) take over the screen — hide
  // the regular chrome but keep the top command bar so the user can still
  // see they're in Verkada Command.
  const editingLayout = curState === 'Z' || curState === 'X';
  return (
    <>
      <StatesSidebar />
      {topBarVisible && <CommandBar />}
      <div className="proto-body">
        <MapView />
        <FloorplanDOMOverlay />
        {!editingLayout && <NavRail />}
        {!editingLayout && <Toolbar />}
        {!editingLayout && <Flyouts />}
        {!editingLayout && <RightPanels />}
        {!editingLayout && <Editor />}
        {!editingLayout && <Settings />}
        {!editingLayout && <CreateLocationPopover />}
        <LayoutEditor />
      </div>
      {!editingLayout && <LayersUi />}
    </>
  );
}
