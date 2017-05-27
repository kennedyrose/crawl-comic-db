'use strict'
require('dotenv').config({ silent: true })
const Nightmare = require('nightmare')
const nightmareOptions = {
	show: false,
	alwaysOnTop: false,
	openDevTools: {
		mode: 'detach'
	}
}

// Get all new IDs
function getNewIds(opt){
	return new Promise((resolve, reject) => {
		const nightmare = Nightmare(nightmareOptions)
		nightmare
			.goto(`https://cloud.collectorz.com/311694/comics?viewType=list`)
			.cookies.set([{
				name: 'comic[collection][sorting]',
				value: '%7B%22AddedDate%22%3A%22DESC%22%7D',
				path: '/',
				secure: true
			}, {
				name: '311694[comic][collection][lastQueryString]',
				value: 'sort%3DAddedDate%26order%3DDESC',
				path: '/',
				secure: true
			}])
			.refresh()
			.wait('.x-collection')
			.evaluate(getList, opt)
			.end()
			.then(ids => {
				opt.comics = ids
				resolve(opt)
			})
			.catch(reject)
	})
}
function getList(opt, done){
	var timeout = 3000
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
			for(cursor = 0; cursor < els.length; cursor++){
				obj = {
					id: els[cursor].getAttribute('rel'),
					series: els[cursor].querySelector('.item-series').textContent,
					issue: els[cursor].querySelector('.item-issue').textContent,
					title: els[cursor].querySelector('.item-title').textContent,
					publisher: els[cursor].querySelector('.item-publisher').textContent,
					publishDate: els[cursor].querySelector('.item-publicationdate').textContent,
					readDate: els[cursor].querySelector('.item-added').textContent
				}
				arr.push(obj)
				if(opt.stopId && obj.id == opt.stopId){
					return callDone()
					continue
				}
			}
		}
		else{
			timeoutProgress++
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



// Get comic info from IDs
function getImages(opt){
	let promises = Promise.resolve()

	for(let i = 0, l = opt.comics.length; i < l; i++){
		promises = promises.then(() => new Promise((resolve, reject) => {
			const nightmare = Nightmare(nightmareOptions)
			nightmare
				.goto(`https://cloud.collectorz.com/311694/comics/detail/${opt.comics[i].id}`)
				.wait('#x-cover-front')
				.evaluate(getCoverImage)
				.end()
				.then(src => {
					console.log(`Parsing ${i + 1}/${l}`)
					if(src){
						opt.comics[i].cover = src
					}
					resolve()
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


module.exports = opt => {
	return new Promise((resole, reject) => {
		// Default options
		opt = Object.assign({
			stopId: '11505577'
		}, opt)
		// Go!
		getNewIds(opt)
			.then(getImages)
			.then(() => console.log(opt))
			.catch(console.error)
	})
}


module.exports()
