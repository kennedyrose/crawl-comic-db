'use strict'
require('dotenv').config({ silent: true })
const crawler = require('./index')

crawler({
		verbose: true,
		stopId: '11805642'
	})
	.then(console.log)
	.catch(console.error)
