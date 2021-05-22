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
            case 'page': return location.pathname.replace(/(\/[^/]+\/[^/]+)\/?[^/]*$/, '$1/' + path);
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

async function fetchWikiStyles() {
    let modules = 'site.styles|site|mediawiki.action.view.metadata|mediawiki.page.startup|mediawiki.page.ready|mediawiki.searchSuggest|mediawiki.page.watch.ajax';
    if (window.host === 'wp') modules += '|ext.echo.styles.badge|ext.uls.interlanguage|ext.visualEditor.desktopArticleTarget.noscript|ext.wikimediaBadges|jquery.makeCollapsible.styles|oojs-ui.styles.icons-alerts|skins.vector.styles.legacy';
    else if (window.host === 'fd') modules += '|ext.cheevos.notifications.styles|ext.fandom.ArticleInterlang.css|ext.fandom.CreatePage.css|ext.fandom.DesignSystem.css|ext.fandom.UserPreferencesV2.css|ext.fandom.bannerNotifications.css|ext.hydraCore.font-awesome.styles|ext.reverb.notifications.styles|ext.social.styles|ext.staffSig.css|ext.visualEditor.desktopArticleTarget.noscript|mediawiki.action.view.filepage|mediawiki.legacy.commonPrint,shared|mediawiki.skinning.interface|skin.hydra.css|skins.hydra.advertisements.styles|skins.hydra.footer,netbar,oasisOverrides,theme|skins.hydra.googlefont.styles|skins.vector.styles|skins.vector.styles.responsive|skins.z.hydra.light.styles';
    const data = await fetch(`${getBaseUrl()}load.php?modules=${modules}&only=styles&skin=minerva&*`, reqOpts).then(data => data.text());
    $('head').innerHTML += `<style>${data}<style>`;
}

async function fetchWikiScripts() {
    let modules = 'startup';
    const data = await fetch(`${getBaseUrl()}load.php?modules=${modules}&only=scripts&skin=minerva&*`, reqOpts).then(data => data.text());
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

async function getPageContent(action) {
    let apiUrl = `${getBaseUrl()}api.php?origin=*&`;
    switch (action) {
        case 'view': apiUrl += `action=parse&page=${window.page}&format=json&prop=text`; break;
        case 'edit': apiUrl += `action=parse&page=${window.page}&format=json&prop=wikitext`; break;
    }
    const data = await fetch(apiUrl, reqOpts).then(data => data.json());
    let pageContent = data.parse?.text['*'];
    return pageContent || '<strong>Error:</strong> The requested page could not be found';
}

async function loadPage(page) {
    if (page) window.page = page;
    changeUrl('page', window.page);
    $('#content').innerHTML = await getPageContent('view');
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
    const [, host, wiki, page] = location.pathname.split('/');
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
    fetchWikiStyles();
    fetchWikiScripts();
    loadPage();
});

window.addEventListener('popstate', () => {
    location.reload();
});
