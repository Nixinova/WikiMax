export const reqOpts = {
    method: 'GET',
    headers: {
        'User-Agent': 'WikiMaxWeb/DEV (https://github.com/Nixinova/WikiMaxWeb)',
    },
};

/**
 * Change to a new URL
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
 * @returns {string} Human-readable name of the wiki
 */
 export function getWikiName() {
    let wikiname = window.wiki.split('.')[window.wiki.includes('.fandom.') ? 0 : 1];
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
