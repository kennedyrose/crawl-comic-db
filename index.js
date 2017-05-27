'use strict'
require('dotenv').config({ silent: true })
const Nightmare = require('nightmare')

// Get all new IDs
function getNewIds(opt){
	return new Promise((resolve, reject) => {
		const nightmare = Nightmare({
			show: false,
			alwaysOnTop: false,
			openDevTools: {
				mode: 'detach'
			}
		})
		nightmare
			.goto(`https://cloud.collectorz.com/311694/comics?viewType=list`, {
				method: 'POST'
			})
			.wait('.x-collection')
			.click('#sortDropdown')
			.select('[name="editView"] select.form-control', 'AddedDate')
			.select('[name="editView"] [name="order"]', 'DESC')
			.click('[for="submit-button-sort-mobile"]')
			.wait('.x-collection')
			.evaluate(getList, opt)
			.end()
			.then(ids => {
				opt.ids = ids
				resolve(opt)
			})
			.catch(reject)
	})
}
function getList(opt, done){
	var timeout = 3000
	var arr = []
	var id
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
				id = els[cursor].getAttribute('rel')
				arr.push(id)
				if(opt.stopId && id == opt.stopId){
					return done(null, arr)
					continue
				}
			}
		}
		else{
			timeoutProgress++
			if(timeoutProgress >= timeout){
				return done(null, arr)
			}
		}
		setTimeout(getBatch, 50)
	}
	getBatch()
}



// Get comic info from IDs
function getInfo(opt){
	
}


module.exports = opt => {
	return new Promise((resole, reject) => {
		// Default options
		opt = Object.assign({
			stopId: '11505577'
		}, opt)
		// Go!
		getNewIds(opt)
			.then(getInfo)
			.then(console.log)
			.catch(console.error)
	})
}


module.exports()
