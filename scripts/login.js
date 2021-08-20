import { reqOpts, getApiUrl } from './common.js';

/**
 * Prepare user login
 * @unfinished
 * @returns {Promise<void>}
 */
export default async function prepareLogin() {
    const tokenData = await fetch(`${getApiUrl()}action=query&meta=tokens&format=json`, reqOpts).then(data => data.json());
    console.log(tokenData)
    const token = tokenData?.query.tokens.csrftoken;

    $('#login').classList.remove('hide');
    $('#login').setAttribute('action', getApiUrl());
    $('[name="loginreturnurl"]').value = encodeURIComponent(location.href);
    $('[name="logintoken"]').value = token;
}
