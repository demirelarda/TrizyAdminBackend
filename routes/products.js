const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')

router.post('/add-product', productController.addProduct)
router.post('/add-trial-product', productController.addTrialProduct)
router.get('/get-all-products', productController.getAllProducts)

module.exports = router