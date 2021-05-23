async function fetchAssets() {
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

async function fetchWikiStyles(modules = []) {
	modules.push(...'site.styles|site|mediawiki.action.view.metadata|mediawiki.page.startup|mediawiki.page.ready|mediawiki.searchSuggest|mediawiki.page.watch.ajax'.split('|'));
	if (window.host === 'wp') modules.push(...'ext.echo.styles.badge|ext.uls.interlanguage|ext.visualEditor.desktopArticleTarget.noscript|ext.wikimediaBadges|jquery.makeCollapsible.styles|oojs-ui.styles.icons-alerts|skins.vector.styles.legacy'.split('|'));
	else if (window.host === 'fd') modules.push(...'|ext.cheevos.notifications.styles|ext.fandom.ArticleInterlang.css|ext.fandom.CreatePage.css|ext.fandom.DesignSystem.css|ext.fandom.UserPreferencesV2.css|ext.fandom.bannerNotifications.css|ext.hydraCore.font-awesome.styles|ext.reverb.notifications.styles|ext.social.styles|ext.staffSig.css|ext.visualEditor.desktopArticleTarget.noscript|mediawiki.action.view.filepage|mediawiki.legacy.commonPrint,shared|mediawiki.skinning.interface|skin.hydra.css|skins.hydra.advertisements.styles|skins.hydra.footer,netbar,oasisOverrides,theme|skins.hydra.googlefont.styles|skins.vector.styles|skins.vector.styles.responsive|skins.z.hydra.light.styles'.split('|'));
	const data = await fetch(`${getBaseUrl()}load.php?modules=${modules.join('|')}&only=styles&skin=minerva&*`, reqOpts).then(data => data.text());
	$('head').innerHTML += `<style>${data}<style>`;
}

async function fetchWikiScripts(modules = []) {
	let moduleSegments = [];
	modules.push('startup');
	for (let i = 0; i < modules.length; i += 10) {
		moduleSegments.push(modules.slice(i, i+10));
	}
	console.log(moduleSegments)
	let data = '';
	for (const modules of moduleSegments) {
		data += await fetch(`${getBaseUrl()}load.php?modules=${modules.join('|')}&only=scripts&skin=minerva&*`, reqOpts).then(data => data.text());
	}
	$('head').innerHTML += `<script>${data}<script>`;
}

async function sendSearch() {
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

async function getPageContent({ page = window.page, mode = 'view' }) {
	let prop;
	let apiUrl = getApiUrl();
	switch (mode) {
		case 'view': prop = 'text'; apiUrl += `action=parse&page=${page}&format=json&prop=${prop}`; break;
		case 'edit': prop = 'wikitext'; apiUrl += `action=parse&page=${page}&format=json&prop=${prop}`; break;
	}
	const data = await fetch(apiUrl, reqOpts).then(data => data.json()).catch(e => console.log(mode, page));
	try {
		if (data.error) throw data.error;
		let content = data.parse?.[prop]['*'];
		if (window.host === 'fd') content = content?.replace(/src="(.+?static.wikia.+?)[?&]cb=\d+"/g, 'rel="noreferrer" src="$1"');
		return content;
	} catch (e) {
		return e;
	}
}
