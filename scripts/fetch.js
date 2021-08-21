import { reqOpts, changeUrl, pageLink, getBaseUrl, getApiUrl } from './common.js';

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
		content += `<li><strong><a href="${pageLink(page)}">${titles[i]}</a></strong></li>`
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
	if (page.toLowerCase().startsWith('special:')) {
		return await getSpecialPageContent(page);
	}
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

/**
 * Fetch special page content
 * @param {string} page Page title
 * @returns {Promise<string>}
 */
async function getSpecialPageContent(page = window.page) {
	const pageName = page.toLowerCase().replace('special:', '');
	switch (pageName) {
		case 'recentchanges': return getRecentChanges();
	}
}

async function getRecentChanges() {
	let apiUrl = `${getApiUrl()}action=query&format=json&list=recentchanges&rcprop=title|ids|sizes|flags|user|loginfo|comment|tags&rclimit=50'`;
	const data = await fetch(apiUrl, reqOpts).then(data => data.json()).catch(e => console.error(e, page));
	const queryResults = data.query.recentchanges;
	const revertedList = [];
	const table = document.createElement('table');
	table.style.maxWidth = '100%';
	for (const entry of queryResults) {
		const { type, title, comment, revid, user, oldlen, newlen, tags } = entry;
		const editDiff = newlen - oldlen;
		const editDiffType = editDiff > 0 ? '+' : editDiff < 0 ? '-' : '';
		const commentContent = comment
			// internal links
			.replace(/\[\[([^\]]+?)(?:\|([^\]]+))?\]\]/g, (_, page, display) => `<a href="${pageLink(page)}">${display || page}</a>`)
			// section headers
			.replace(/\/\*(.+?)\*\//, (_, section) => `<a href="${pageLink(title, { '#': section })}">&rarr;${section.trim()}</a>:`)
			// bonus: revision IDs
			.replace(/(Undo revision )(\d+)/gi, (_, msg, diff) => {
				revertedList.push(+diff);
				return `${msg}<a href="${getBaseUrl()}Special:Diff/${diff}" target="_blank">${diff}</a>`;
			})
		const editDiffStyle = `color: ${{ '+': 'green', '-': 'red', '': 'gray' }[editDiffType]}`;

		const tr = document.createElement('tr');
		tr.dataset.type = type;
		if (type === 'log' || type === 'categorize') tr.classList.add('hide');
		if (revertedList.includes(revid)) tr.classList.add('edit-reverted');
		tr.innerHTML = `
			<td>${type[0].toUpperCase()}</td>
			<td class="rc-title"><strong><a href="${pageLink(title)}">${title}</strong></td>
			<td><a href="${getBaseUrl()}Special:Diff/${revid}" target="_blank">(diff)</a></td>
			<td class="rc-diff" style="${editDiffStyle}">${(editDiffType.replace('-', '&minus;')) + Math.abs(editDiff)}</td>
			<td><a href="${pageLink('User:' + user)}">${user}</a></td>
			<td style="max-width:400px;"><em>${commentContent ? `(${commentContent})` : ''}</em></td>
			<td><small>${tags.length ? `(${tags.join(' | ')})` : ''}</small></td>
		`
		table.appendChild(tr);
	}
	const styles = `<style>
		tr {outline: 1px solid gray;}
		td {display: inline-block; padding: 4px;}
		td .rc-diff :visited {font-style: italic;}
		#rc-toggles button {border: 1px solid gray;}
		.rc-title {width: 250px; word-break: break-word;}
		.shown {background: #5f5;} .shown::after {content: 'Shown';}
		.hidden {background: #f55;} .hidden::after {content: 'Hidden';}
		.edit-reverted td {text-decoration: line-through; font-style: italic;}
	</style>`
	window.toggleRCItem = (elem, type) => {
		$$(`[data-type='${type}']`).forEach(elem => elem.classList.toggle('hide'));
		elem.classList.toggle('hidden');
		elem.classList.toggle('shown');
	};
	const toggles = `<div id="rc-toggles">
		Edits: <button class="shown" onclick="toggleRCItem(this, 'edit')"></button>
		Creations: <button class="shown" onclick="toggleRCItem(this, 'new')"></button>
		Categories: <button class="hidden" onclick="toggleRCItem(this, 'categorize')"></button>
		Logs: <button class="hidden" onclick="toggleRCItem(this, 'log')"></button>
	</div>`;
	return styles + toggles + table.outerHTML;
}
