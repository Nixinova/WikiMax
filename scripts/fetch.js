function getWikiName() {
    let wikiname = window.wiki.split('.')[window.wiki.includes('.fandom.') ? 0 : 1];
    return wikiname[0].toUpperCase() + wikiname.slice(1);
}

async function getPageContent(action) {
    const reqOpts = {
        method: 'GET',
        headers: {
            'User-Agent': 'WikiMaxWeb/DEV (https://github.com/Nixinova/WikiMaxWeb)',
        },
    };
    let apiUrl = `https://${window.wiki}${window.wiki.includes('.fandom.') ? '' : '/w'}/api.php?origin=*&`;
    switch (action) {
        case 'view': apiUrl += `action=parse&page=${window.page}&format=json&prop=text`; break;
        case 'edit': apiUrl += `action=parse&page=${window.page}&format=json&prop=wikitext`; break;
    }
    const data = await fetch(apiUrl, reqOpts).then(data => data.json());
    let pageContent = data.parse?.text['*'];
    return pageContent || '<>Error</> The requested page could not be found';
}

const $ = sel => document.querySelector(sel);
document.addEventListener('DOMContentLoaded', async () => {
    const url = new URL(location);
    window.wiki = url.searchParams.get('wiki') || 'en.wikipedia.org';
    window.page = url.searchParams.get('page') || 'Main_Page';
    $('#wiki-name').innerText = getWikiName(window.wiki);
    $('#page-heading').innerText = window.page.replace(/_/g, ' ');
    $('#content').innerHTML = await getPageContent('view');
    $('title').innerHTML = `${window.page.replace(/_/g, ' ')} &ndash; ${getWikiName(window.wiki)} via WikiMax`;
    document.body.innerHTML = document.body.innerHTML.replace(/href="\/wiki\/(.+?)"/g, (_, page) => {
        return `href="?wiki=${window.wiki}&page=${page.replace(/\?/, '#')}"`;
    });
});
