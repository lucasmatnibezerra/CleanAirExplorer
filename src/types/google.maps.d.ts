// Minimal google maps ambient declarations (subset) to satisfy TS before @types are added.
// For richer typing, install: npm i -D @types/google.maps

declare namespace google.maps {
  interface MapOptions { center: { lat:number; lng:number }; zoom:number; mapId?:string }
  class Map { constructor(el: HTMLElement, opts: MapOptions); setCenter(latLng:{lat:number; lng:number}):void }
}

declare namespace google.maps.marker {
  class AdvancedMarkerElement { constructor(opts:any); map:any; addListener(ev:string, fn:Function):void }
}

export {}