const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

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

function getApiUrl() {
    return `${getBaseUrl()}api.php?origin=*&`;
}
