const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')

router.get('/get-feed-orders', orderController.getFeedOrders)
router.get('/search-order-by-id', orderController.searchOrderById)
router.get('/details/:orderId', orderController.getOrderDetails)
router.patch('/update-status/:orderId', orderController.updateOrderStatus)



module.exports = router