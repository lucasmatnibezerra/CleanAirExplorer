import '@testing-library/jest-dom'
import { ensureTestI18n } from './src/test/test-i18n'

// Initialize isolated i18n instance once for all tests to silence react-i18next warnings.
ensureTestI18n()

// Lightweight Google Maps mock so map-dependent components don't warn or crash in tests.
if(!(globalThis as any).google){
	const listeners: any[] = []
	class Projection {
		fromLatLngToPoint(latLng:any){
			// Simple equirectangular projection approximation
			return { x: (latLng.lng() + 180)/360, y: (1 - (latLng.lat()+90)/180) }
		}
		fromPointToLatLng(pt:any){
			return { lat: ()=> (1 - pt.y)*180 - 90, lng: ()=> pt.x*360 - 180 }
		}
	}
	class MapMock {
		private zoom:number; private center:any; private proj:Projection
		constructor(_el:HTMLElement, opts:any){
			this.zoom = opts?.zoom ?? 4
			this.center = { lat: ()=> (opts?.center?.lat ?? 38), lng: ()=> (opts?.center?.lng ?? -95) }
			this.proj = new Projection()
		}
		addListener(ev:string, cb:()=>void){ listeners.push({ ev, cb }); return { remove: ()=>{} } }
		getZoom(){ return this.zoom }
		getCenter(){ return this.center }
		getProjection(){ return this.proj }
	}
		class AdvancedMarkerElementMock {
			map:any; position:any; content!:HTMLElement; title?:string
		constructor(opts:any){ Object.assign(this, opts) }
		addListener(_e:string,_cb:()=>void){ /* noop */ }
	}
	const event = {
		addListener: (_target:any,_ev:string,cb:()=>void) => { listeners.push({ cb }); return { remove:()=>{} } },
		removeListener: (_l:any)=>{/* noop */}
	}
	;(globalThis as any).google = {
		maps: {
			Map: MapMock,
			LatLng: function(lat:number,lng:number){ return { lat:()=>lat, lng:()=>lng } },
			marker: { AdvancedMarkerElement: AdvancedMarkerElementMock },
			event
		}
	}
}

// Provide a basic 2D canvas context mock so rendering code doesn't throw in jsdom.
;(HTMLCanvasElement.prototype as any).getContext = function(){
	return {
		fillStyle: '#000',
		clearRect: () => {},
		fillRect: () => {},
		beginPath: () => {},
		moveTo: () => {},
		lineTo: () => {},
		stroke: () => {},
		arc: () => {},
		closePath: () => {},
		putImageData: () => {},
		getImageData: () => ({ data: new Uint8ClampedArray(0) })
	}
}
