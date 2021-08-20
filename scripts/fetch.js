import { reqOpts, changeUrl, getBaseUrl, getApiUrl } from './common.js';

/**
 * Fetch wiki assets
 * @returns {Promise<void>}
 */
export async function fetchAssets() {
	const gadgets = await getPageContent({ page: 'MediaWiki:Gadgets-definition', mode: 'edit' });
	let styles = [], scripts = [];
	gadgets.split('\n').forEach(line => {
		if (line.startsWith('=')) return;
		line.match(/\w+.css/g)?.forEach(s => styles.push(s.replace('.css', '')));
		line.match(/\w+.js/g)?.forEach(s => scripts.push(s.replace('.js', '')));
	})
	fetchWikiStyles(styles).catch(a => a);
	fetchWikiScripts(scripts).catch(a => a);
}

/**
 * Fetch wiki styling files
 * @param {string[]} modules Style modules to fetch
 */
async function fetchWikiStyles(modules = []) {
	modules.push(...'site.styles|site|mediawiki.action.view.metadata|mediawiki.page.startup|mediawiki.page.ready|mediawiki.searchSuggest|mediawiki.page.watch.ajax'.split('|'));
	const data = await fetch(`${getBaseUrl()}load.php?modules=${modules.join('|')}&only=styles&skin=minerva&*`, reqOpts).then(data => data.text());
	$('head').innerHTML += `<style>${data}<style>`;
}

/**
 * Fetch wiki script files
 * @param {string[]} modules Script modules to fetch
 */
async function fetchWikiScripts(modules = []) {
	let moduleSegments = [];
	modules.push('startup');
	for (let i = 0; i < modules.length; i += 10) {
		moduleSegments.push(modules.slice(i, i + 10));
	}
	let data = '';
	for (const modules of moduleSegments) {
		data += await fetch(`${getBaseUrl()}load.php?modules=${modules.join('|')}&only=scripts&skin=minerva&*`, reqOpts).then(data => data.text());
	}
	$('head').innerHTML += `<script>${data}<script>`;
}

/**
 * Fetch search content
 * @returns {Promise<void>}
 * @usedin HTML
 */
export async function sendSearch() {
	let search = $('#search-value').value;
	const apiUrl = `${getApiUrl()}action=opensearch&search=${search}&limit=10&format=json`;
	const data = await fetch(apiUrl, reqOpts).then(data => data.json());
	const [, titles, , urls] = data;
	changeUrl('page', 'Special:Search');
	$('#page-heading').innerText = 'Search results';
	let content = '';
	for (const i in titles) {
		let page = urls[i].split('/').slice(-1)[0];
		content += `<li><strong><a href="javascript:loadPage('${page}');">${titles[i]}</a></strong></li>`
	}
	$('#content').innerHTML = `<ul>${content}</ul>`;
}
window.sendSearch = sendSearch;

/**
 * Fetch regular page content
 * @param {{page: string, mode: 'view' | 'edit'}} opts Options
 * @returns {Promise<string>}
 */
export async function getPageContent({ page = window.page, mode = 'view' }) {
	const prop = { view: 'text', edit: 'wikitext' }[mode];
	const apiUrl = `${getApiUrl()}action=parse&page=${page}&format=json&prop=${prop}`;
	const data = await fetch(apiUrl, reqOpts).then(data => data.json()).catch(e => console.error(e, mode, page));
	let content = data.parse?.[prop]['*'];
	if (window.host === 'fd') {
		// Images from Fandom do not load
		content = content?.replace(/src=".+?static.wikia.+?"/g, 'src');
	}
	return content;
}
