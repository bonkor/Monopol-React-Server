// src/controllers/PropertyPanelController.ts

type OpenFn = (index: number) => void;
type CloseFn = () => void;

let openPropertyPanelExternal: OpenFn | null = null;
let closePropertyPanelExternal: CloseFn | null = null;

export function registerOpenPropertyPanel(fn: OpenFn) {
  openPropertyPanelExternal = fn;
}

export function registerClosePropertyPanel(fn: CloseFn) {
  closePropertyPanelExternal = fn;
}

export function openPropertyPanelExternally(index: number) {
  if (openPropertyPanelExternal) {
    openPropertyPanelExternal(index);
  } else {
    console.warn('openPropertyPanel not registered yet');
  }
}

export function closePropertyPanelExternally() {
  if (closePropertyPanelExternal) {
    closePropertyPanelExternal();
  } else {
    console.warn('closePropertyPanel not registered yet');
  }
}
