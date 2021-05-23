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

	$$('h1:not(#page-heading),h2,h3,h4,h5,h6').forEach((elem, i) => {
		let heading = elem.id || elem.querySelector('.mw-headline')?.innerText || elem.innerText.replace('[edit]', '');
		elem.id = '';
		elem.innerHTML = `
			<span class="mw-headline" id="${heading.replace(/ /g, '_')}">${heading}</span>
			<span class="mw-editsection">
				<span class="mw-editsection-bracket">[</span>
				<a href="${getBaseUrl()}index.php?title=${window.page}&action=edit&section=${i}&mobileaction=toggle_view_desktop" title="Edit section: ${heading}" target="_blank">edit</a>
				<span class="mw-editsection-bracket">]</span>
			</span>
		`;
	})
	if ($('.redirectText')) {
		window.page = $('.redirectText a').innerText.replace(/ /g, '_');
		loadPage();
	}
}
