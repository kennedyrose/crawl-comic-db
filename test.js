'use strict'
const crawler = require('./index')
crawler({
		verbose: true,
		stopId: '11805642',
		userId: '311694'
	})
	.then(console.log)
	.catch(console.error)
