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
