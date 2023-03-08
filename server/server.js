// Import dependencies
const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const https = require('https')
const fs = require("fs")
// Import routes
const usersRouter = require('./routes/dbRoutes')

// Set default port for express app
const PORT = 2053

// Create express app
const app = express()

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true
}

app.use(helmet())
app.use(compression())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors(corsOptions))

app.use('/PRDB', usersRouter)

app.use(function (err, req, res) {
  console.error(err.stack)
  res.status(404).send('Something is broken.')
})

app.use(function (req, res) {
  res.status(404).send('Sorry we could not find that.')
})

https
	.createServer(
	{
	key: fs.readFileSync("key.pem"),
	cert: fs.readFileSync("cert.pem"),
	},
	app
	)
	.listen(PORT, function() {
		console.log('HTTPS server running on: ' + PORT)
})

//app.listen(PORT, function() {
//	console.log('HTTP server running on: ' + PORT)
//})
