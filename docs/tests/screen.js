(async () => {

const hashMini = str => {
	const json = `${JSON.stringify(str)}`
	let i, len, hash = 0x811c9dc5
	for (i = 0, len = json.length; i < len; i++) {
		hash = Math.imul(31, hash) + json.charCodeAt(i) | 0
	}
	return ('0000000' + (hash >>> 0).toString(16)).substr(-8)
}

// ie11 fix for template.content
function templateContent(template) {
	// template {display: none !important} /* add css if template is in dom */
	if ('content' in document.createElement('template')) {
		return document.importNode(template.content, true)
	} else {
		const frag = document.createDocumentFragment()
		const children = template.childNodes
		for (let i = 0, len = children.length; i < len; i++) {
			frag.appendChild(children[i].cloneNode(true))
		}
		return frag
	}
}

// tagged template literal (JSX alternative)
const patch = (oldEl, newEl, fn = null) => {
	oldEl.parentNode.replaceChild(newEl, oldEl)
	return typeof fn === 'function' ? fn() : true
}
const html = (stringSet, ...expressionSet) => {
	const template = document.createElement('template')
	template.innerHTML = stringSet.map((str, i) => `${str}${expressionSet[i] || ''}`).join('')
	return templateContent(template) // ie11 fix for template.content
}

const query = ({ type, rangeStart, rangeLen }) => {
	const el = document.getElementById('fingerprint-data')
	patch(el, html`
		<div id="fingerprint-data">
			<style>
				${[...Array(rangeLen)].map((slot,i) => {
					i += rangeStart
					return `
						@media (device-${type}: ${i}px) {body {--device-${type}: ${i};}}
					`
				}).join('')}
			</style>
		</div>
	`)
	const style = getComputedStyle(document.body)
	return style.getPropertyValue(`--device-${type}`).trim()
}

const getScreenMedia = () => {
	let i, widthMatched, heightMatched
	for (i = 0; i < 10; i++) {
		let resWidth, resHeight
		if (!widthMatched) {
			resWidth = query({ type: 'width', rangeStart: i*1000, rangeLen: 1000})
			if (resWidth) {
				widthMatched = resWidth
			}
		}
		if (!heightMatched) {
			resHeight = query({type: 'height', rangeStart: i*1000, rangeLen: 1000})
			if (resHeight) {
				heightMatched = resHeight
			}
		}
		if (widthMatched && heightMatched) {
			break
		}	
	}
	return { width: widthMatched, height: heightMatched }
}

const getScreenMatchMedia = () => {
	let widthMatched, heightMatched
	for (let i = 0; i < 10; i++) {
		let resWidth, resHeight
		if (!widthMatched) {
			let rangeStart = i*1000
			const rangeLen = 1000
			for (let i = 0; i < rangeLen; i++) {
				if (matchMedia(`(device-width:${rangeStart}px)`).matches) {
					resWidth = rangeStart
					break
				}
				rangeStart++
			}
			if (resWidth) {
				widthMatched = resWidth
			}
		}
		if (!heightMatched) {
			let rangeStart = i*1000
			const rangeLen = 1000
			for (let i = 0; i < rangeLen; i++) {
				if (matchMedia(`(device-height:${rangeStart}px)`).matches) {
					resHeight = rangeStart
					break
				}
				rangeStart++
			}
			if (resHeight) {
				heightMatched = resHeight
			}
		}
		if (widthMatched && heightMatched) {
			break
		}	
	}
	return { width: widthMatched, height: heightMatched }
}

const getCSS = () => {
	const gcd = (a, b) => b == 0 ? a : gcd(b, a%b)
	const { innerWidth: w, innerHeight: h } = window
	const { width: sw, height: sh } = screen
	const r = gcd(w, h)
	const sr = gcd(sw, sh)
	const aspectRatio = `${w/r}/${h/r}`
	const deviceAspectRatio = `${sw/sr}/${sh/sr}`
	const el = document.getElementById('fingerprint-data')
	patch(el, html`
		<div id="fingerprint-data">
			<style>
				@media (aspect-ratio: ${aspectRatio}) {
					body {--viewport-aspect-ratio: ${aspectRatio};}
				}
				@media (device-aspect-ratio: ${deviceAspectRatio}) {
					body {--device-aspect-ratio: ${deviceAspectRatio};}
				}
				@media (device-width: ${sw}px) and (device-height: ${sh}px) {
					body {--device-screen: ${sw} x ${sh};}
				}
				@media (display-mode: fullscreen) {body {--display-mode: fullscreen;}}
				@media (display-mode: standalone) {body {--display-mode: standalone;}}
				@media (display-mode: minimal-ui) {body {--display-mode: minimal-ui;}}
				@media (display-mode: browser) {body {--display-mode: browser;}}
				@media (orientation: landscape) {body {--orientation: landscape;}}
				@media (orientation: portrait) {body {--orientation: portrait;}}
			</style>
		</div>
	`)
	const style = getComputedStyle(document.body)
	return {
		viewportAspectRatio: style.getPropertyValue('--viewport-aspect-ratio').trim() || undefined,
		deviceAspectRatio: style.getPropertyValue('--device-aspect-ratio').trim() || undefined,
		deviceScreen: style.getPropertyValue('--device-screen').trim() || undefined,
		orientation: style.getPropertyValue('--orientation').trim() || undefined,
		displayMode: style.getPropertyValue('--display-mode').trim() || undefined
	}
}

const start = performance.now()

const {
	width,
	height,
	availWidth,
	availHeight,
	colorDepth,
	pixelDepth,
	orientation: { type: orientationType }
} = screen


const { width: viewportWidth, height: viewportHeight } = visualViewport
const { width: mediaWidth, height: mediaHeight } = getScreenMedia()
const { width: matchMediaWidth, height: matchMediaHeight } = getScreenMatchMedia()
const {
	viewportAspectRatio,
	deviceAspectRatio,
	deviceScreen,
	orientation,
	displayMode
} = getCSS()

const validScreen = (
	matchMedia(`(device-width:${width}px)`).matches &&
	matchMedia(`(device-height:${height}px)`).matches &&
	deviceScreen &&
	viewportAspectRatio &&
	deviceAspectRatio
)

const fake = () => `<span class="fake">fake screen</span>`
const el = document.getElementById('fingerprint-data')
patch(el, html`
	<div id="fingerprint-data">
		<style>
			#fingerprint-data > .jumbo {
				font-size: 32px;
			}
			.fake {
				color: #ca656e;
				background: #ca656e0d;
				border-radius: 2px;
				margin: 0 5px;
				padding: 1px 3px;
			}
		</style>
		<div class="visitor-info">
			<strong>Screen</strong>
		</div>
		<div class="jumbo">
			<div>${hashMini({ mediaWidth, mediaHeight })}</div>
		</div>
		<div class="flex-grid">
			<div class="col-six relative">
				<span class="aside-note">${(performance.now() - start).toFixed(2)}ms</span>
				<div>@media: ${''+mediaWidth} x ${''+mediaHeight}</div>

				
				<div>@media aspect-ratio: ${
					viewportAspectRatio ? ''+viewportAspectRatio : fake()
				}</div>
				<div>@media device-aspect-ratio: ${
					deviceAspectRatio ? ''+deviceAspectRatio : fake()
				}</div>

				
				<div>matchMedia: ${''+matchMediaWidth} x ${''+matchMediaHeight}</div>
				
				<div>screen: ${''+width} x ${''+height}${!validScreen ? fake() : ''}</div>
				<div>avail: ${''+availWidth} x ${''+availHeight}</div>
				<div>outer: ${''+outerWidth} x ${''+outerHeight}</div>
				<div>inner: ${''+innerWidth} x ${''+innerHeight}</div>
				
				<div>colorDepth: ${''+colorDepth}</div>
				<div>pixelDepth: ${''+pixelDepth}</div>
				<div>devicePixelRatio: ${''+devicePixelRatio}</div>
				<div>orientation: ${''+orientationType}</div>
				<div>@media orientation: ${''+orientation}</div>
				<div>@media display-mode: ${''+displayMode}</div>

				<div>viewport: ${''+viewportWidth} x ${''+viewportHeight}</div>
				
			</div>
		</div>
	</div>
`)

})()