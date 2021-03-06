'use strict'
const Nightmare = require('nightmare')
const nightmareOptions = {
	show: false,
	alwaysOnTop: false,
	executionTimeout: false,
	/*
	openDevTools: {
		mode: 'detach'
	}
	*/
}

// Get all new IDs
function getNewIds(opt){
	return new Promise((resolve, reject) => {
		console.log('Getting all new IDs...')
		const nightmare = Nightmare(nightmareOptions)
		nightmare
			.goto(`https://cloud.collectorz.com/${opt.userId}/comics?viewType=list`)
			.cookies.set([{
				name: 'comic[collection][sorting]',
				value: '%7B%22AddedDate%22%3A%22DESC%22%7D',
				path: '/',
				secure: true
			}, {
				name: '${opt.userId}[comic][collection][lastQueryString]',
				value: 'sort%3DAddedDate%26order%3DDESC',
				path: '/',
				secure: true
			}])
			.refresh()
			.wait('.x-collection')
			.evaluate(getList, opt)
			.end()
			.then(ids => {
				console.log('Got IDs.')
				opt.comics = ids
				resolve(opt)
			})
			.catch(reject)
	})
}
function getList(opt, done){
	var timeout = 90
	var arr = []
	var obj
	// Continuous scrolling
	setInterval(function(){
		document.body.scrollTop += 10000
	}, 500)
	// Get IDs
	var timeoutProgress = 0
	var els
	var cursor = 0
	function getBatch(){
		console.log('Getting batch...')
		els = document.querySelector('.x-collection tbody').children
		if(els.length - 1 >= cursor){
			timeoutProgress = 0
			for(cursor = 0; cursor < els.length; cursor++){
				var title = els[cursor].querySelector('.item-title').textContent
				console.log('Found: ' + title)
				obj = {
					id: els[cursor].getAttribute('rel'),
					series: els[cursor].querySelector('.item-series').textContent,
					issue: els[cursor].querySelector('.item-issue').textContent,
					title: title,
					publisher: els[cursor].querySelector('.item-publisher').textContent,
					publishDate: els[cursor].querySelector('.item-publicationdate').textContent,
					readDate: els[cursor].querySelector('.item-added').textContent
				}
				if(opt.stopId && obj.id == opt.stopId){
					return callDone()
				}
				arr.push(obj)
			}
		}
		else{
			timeoutProgress++
			console.log('Nothing new found ('+timeoutProgress+')...')
			if(timeoutProgress >= timeout){
				return callDone()
			}
		}
		setTimeout(getBatch, 50)
	}
	function callDone(){
		done(null, arr)
	}
	getBatch()
}


// Sorts comics by date, series, then issue
function sortComics(a, b){
	if(a.readDate < b.readDate){
		return -1
	}
	if(a.readDate > b.readDate){
		return 1
	}
	// If date is the same
	if(a.series < b.series){
		return -1
	}
	if(a.series > b.series){
		return 1
	}
	// If date and series are the same
	if(a.issue < b.issue){
		return -1
	}
	if(a.issue > b.issue){
		return 1
	}
	return 0
}


// Get comic info from IDs
function getImages(opt){
	let promises = Promise.resolve()

	opt.comics.reverse()

	for(let i = 0, l = opt.comics.length; i < l; i++){
		promises = promises.then(() => new Promise((resolve, reject) => {
			if(opt.verbose){
				console.log(`Getting image for ${opt.comics[i].series} ${opt.comics[i].issue}`)
			}
			const nightmare = Nightmare(nightmareOptions)
			nightmare
				.goto(`https://cloud.collectorz.com/${opt.userId}/comics/detail/${opt.comics[i].id}`)
				.wait('#x-cover-front')
				.evaluate(getCoverImage)
				.end()
				.then(src => {
					if(src){
						opt.comics[i].cover = src
					}
					if(opt.verbose){
						console.log(`Parsing ${i + 1}/${l}`)
					}
					if('cb' in opt){
						opt.cb(opt.comics[i], resolve)
					}
					else{
						resolve()
					}
				})
				.catch(reject)
		}))
	}
	return promises
}
function getCoverImage(){
	var el = document.querySelector('#x-cover-front')
	if(el){
		return el.src
	}
	else{
		return false
	}
}


module.exports = (opt) => {
	return new Promise((resolve, reject) => {
		if(opt.verbose){
			console.log('Starting up...')
		}
		// Go!
		getNewIds(opt)
			.then(getImages)
			.then(() => resolve(opt.comics))
			.catch(reject)
	})
}
