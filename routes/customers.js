const express = require('express')
const router = express.Router()
const customerController = require('../controllers/customerController')

router.get('/get-customers', customerController.getCustomers)
router.get('/search-customer-by-id/:id', customerController.searchCustomerById)

module.exports = router