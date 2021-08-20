export const reqOpts = {
    method: 'GET',
    headers: {
        'User-Agent': 'WikiMaxWeb/DEV (https://github.com/Nixinova/WikiMaxWeb)',
    },
};

/**
 * Change URL without reloading page
 * @param {'all' | 'page'} type 
 * @param {string} path 
 */
export function changeUrl(type, path) {
    const newPath = (() => {
        switch (type) {
            case 'all': return path;
            case 'page': return location.pathname.replace(/(\/[^/]+\/[^/]+)\/?.*$/, '$1/' + path);
        }
    })();
    history.pushState({}, '', newPath);
}

/**
 * Create an internal hyperlink
 * @param {string} title
 * @param {object} options
 * @returns {string} JavaScript href
 */
export function pageLink(title, { '#': hash, '?': search } = {}) {
    let page = encodeURIComponent(title.trim().replace(/ /g, '_').replace(/\?.+$/, '')).replace(/%3A/gi, ':');
    if (hash) page += '#' + encodeURIComponent(hash.trim().replace(/ /g, '_'));
    if (search) page += '?' + encodeURIComponent(search);
    return getCurrentBaseUrl(title) + page;
    // return `javascript:loadPage('${page}')`;
}

/**
 * @returns {string} Human-readable name of the wiki
 */
export function getWikiName() {
    const wikiname = window.wiki.split('.')[window.wiki.includes('.fandom.') ? 0 : 1];
    return wikiname[0].toUpperCase() + wikiname.slice(1);
}

/**
 * @returns {string} Base wiki URL
 */
export function getBaseUrl() {
    return `https://${window.wiki}${window.wiki.includes('.fandom.') ? '' : '/w'}/`;
}

/**
 * @returns {string} API URL
 */
export function getApiUrl() {
    return `${getBaseUrl()}api.php?origin=*&`;
}

/**
 * @returns {string} WikiWeb base URL
 */
export function getCurrentBaseUrl() {
    return location.href.split('/').slice(0, 5).join('/') + '/';
}
