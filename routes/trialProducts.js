const express = require('express')
const router = express.Router()
const trialProductController = require('../controllers/trialProductController')

router.post('/add-trial-product', trialProductController.addTrialProduct)

module.exports = router