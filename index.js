'use strict'
require('dotenv').config({ silent: true })
const Nightmare = require('nightmare')

module.exports = (opt) => {
	opt = Object.assign({
		stopId: '11505577'
	}, opt)
	const nightmare = Nightmare({
		show: true,
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
		.evaluate(getList, opt)
		.end()
		.then(console.log)
		.catch(console.error)
}

function getList(opt){
	var els = document.querySelector('.x-collection tbody').children
	var arr = []
	var i = 0
	var id
	for(i = 0; i < els.length; i++){
		id = els[i].getAttribute('rel')
		arr.push(id)
		if(opt.stopId && id == opt.stopId){
			continue
		}
	}
	return arr
}

module.exports()
