// Import express
const express = require('express')

// Import controller
const userRoots = require('./../controllers/dbController.js')

// Create router
const router = express.Router()


router.get('/all', userRoots.getUsers)

router.post('/create', userRoots.createUser)

router.post('/addDatapoint', userRoots.postDatapoint)

router.put('/delete', userRoots.deleteUser)

router.put('/reset', userRoots.resetUsers)

// Export router
module.exports = router