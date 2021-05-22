const $ = sel => document.querySelector(sel);
const reqOpts = {
    method: 'GET',
    headers: {
        'User-Agent': 'WikiMaxWeb/DEV (https://github.com/Nixinova/WikiMaxWeb)',
    },
};

function changeUrl(type, path) {
    let newPath = (() => {
        switch (type) {
            case 'all': return path;
            case 'page': return location.pathname.replace(/(\/[^/]+\/[^/]+)\/?.*$/, '$1/' + path);
        }
    })();
    history.pushState({}, '', newPath);
}

function getWikiName() {
    let wikiname = window.wiki.split('.')[window.wiki.includes('.fandom.') ? 0 : 1];
    return wikiname[0].toUpperCase() + wikiname.slice(1);
}

function getBaseUrl() {
    return `https://${window.wiki}${window.wiki.includes('.fandom.') ? '' : '/w'}/`;
}

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
    modules.push('startup');
    const data = await fetch(`${getBaseUrl()}load.php?modules=${modules.join('|')}&only=scripts&skin=minerva&*`, reqOpts).then(data => data.text());
    $('head').innerHTML += `<script>${data}<script>`;
}

async function sendSearch() {
    let search = $('#search-value').value;
    const apiUrl = `${getBaseUrl()}api.php?origin=*&action=opensearch&search=${search}&limit=10&format=json`;
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
    let apiUrl = `${getBaseUrl()}api.php?origin=*&`;
    let prop;
    switch (mode) {
        case 'view': prop = 'text'; apiUrl += `action=parse&page=${page}&format=json&prop=${prop}`; break;
        case 'edit': prop = 'wikitext'; apiUrl += `action=parse&page=${page}&format=json&prop=${prop}`; break;
    }
    const data = await fetch(apiUrl, reqOpts).then(data => data.json()).catch(e => console.log(mode, page));
    try {
        let content = data.parse?.[prop]['*'];
        if (window.host === 'fd') content = content.replace(/src=".+?static.wikia.+?"/g, 'src');
        return content;
    } catch (e) {
        return e;
    }
}

async function loadPage(page) {
    if (page) window.page = page;
    changeUrl('page', window.page);
    $('#content').innerHTML = await getPageContent({ mode: 'view' });
    $('#wiki-name').innerText = getWikiName(window.wiki);
    $('#page-heading').innerText = window.page.replace(/_/g, ' ');
    $('title').innerHTML = `${window.page.replace(/_/g, ' ')} &ndash; ${getWikiName(window.wiki)} via WikiMax`;
    document.body.innerHTML = document.body.innerHTML.replace(/href="\/wiki\/(.+?)"/g, (_, page) => {
        return `href="javascript:loadPage('${encodeURIComponent(page.replace(/\?.+$/, ''))}');"`;
    });
    if ($('.redirectText')) {
        window.page = $('.redirectText a').innerText.replace(/ /g, '_');
        loadPage();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let [, host, wiki, ...page] = location.pathname.split('/');
    page = page.join('/');
    if (!page) changeUrl('page', 'Main_Page');
    document.body.classList.add(host);
    window.host = host;
    window.page = page || 'Main_Page';
    if (host === 'fd') {
        window.wiki = (wiki || 'community') + '.fandom.com';
    }
    else /*if (host === 'wp')*/ {
        window.wiki = (wiki || 'en') + '.wikipedia.org';
    }
    fetchAssets();
    loadPage();
});

window.addEventListener('popstate', () => {
    if (!location.hash) location.reload();
});
