const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')
const UserAddress = require('../models/UserAddress')

exports.getFeedOrders = async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query

    try {
        const query = status ? { status } : {}
        const skip = (page - 1) * limit

        const orders = await Order.find(query)
            .populate('userId', 'userFirstName userLastName email') 
            .populate('items.productId', 'imageURLs title') 
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(parseInt(limit))

       
        const totalOrders = await Order.countDocuments(query)

       
        const formattedOrders = orders.map((order) => {
            const items = order.items.map((item) => ({
                title: item.productId ? item.productId.title : null, 
                imageURL: item.productId ? item.productId.imageURLs[0] : null,
                quantity: item.quantity,
                price: item.price,
            }))

            return {
                orderId: order._id,
                status: order.status,
                items,
                user: {
                    firstName: order.userId.userFirstName,
                    lastName: order.userId.userLastName,
                    email: order.userId.email,
                },
                createdAt: order.createdAt,
                itemsCount: order.items.length,
                amount: order.amount,
            }
        })

        res.status(200).json({
            success: true,
            orders: formattedOrders,
            pagination: {
                totalOrders,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                limit: parseInt(limit),
            },
        })
    } catch (error) {
        console.error("Error fetching feed orders:", error)
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders.",
            error: error.message,
        })
    }
}


exports.searchOrderById = async (req, res) => {
    const { orderId } = req.query

    if (!orderId) {
        return res.status(400).json({
            success: false,
            message: "Order ID is required.",
        })
    }

    try {
        
        const order = await Order.findById(orderId)
            .populate('userId', 'userFirstName userLastName email') 
            .populate('items.productId', 'imageURLs title') 

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            })
        }

       
        const items = order.items.map((item) => ({
            title: item.productId ? item.productId.title : null, 
            imageURL: item.productId ? item.productId.imageURLs[0] : null, 
            quantity: item.quantity,
            price: item.price,
        }))

        const formattedOrder = {
            orderId: order._id,
            status: order.status,
            items,
            user: {
                firstName: order.userId.userFirstName,
                lastName: order.userId.userLastName,
                email: order.userId.email,
            },
            createdAt: order.createdAt,
            itemsCount: order.items.length,
            amount: order.amount,
        }

        res.status(200).json({
            success: true,
            order: formattedOrder,
        })
    } catch (error) {
        console.error("Error searching order by ID:", error)
        res.status(500).json({
            success: false,
            message: "Failed to search for the order.",
            error: error.message,
        })
    }
}

exports.getOrderDetails = async (req, res) => {
    const { orderId } = req.params

    if (!orderId) {
        return res.status(400).json({
            success: false,
            message: 'Order ID is required.',
        })
    }

    try {
        const order = await Order.findById(orderId)
            .populate('userId', 'userFirstName userLastName email') 
            .populate('deliveryAddress') 
            .populate('items.productId', 'imageURLs title price salePrice cargoWeight') 

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found.',
            })
        }

        const items = order.items.map((item) => ({
            productId: item.productId._id,
            title: item.productId.title,
            imageURL: item.productId.imageURLs[0] || null, 
            price: item.productId.price,
            salePrice: item.productId.salePrice,
            cargoWeight: item.productId.cargoWeight,
            quantity: item.quantity,
        }))

        const orderDetails = {
            orderId: order._id,
            createdAt: order.createdAt,
            user: {
                userId: order.userId._id,
                firstName: order.userId.userFirstName,
                lastName: order.userId.userLastName,
                email: order.userId.email
            },
            deliveryAddress: {
                fullName: order.deliveryAddress.fullName,
                phoneNumber: order.deliveryAddress.phoneNumber,
                address: order.deliveryAddress.address,
                city: order.deliveryAddress.city,
                state: order.deliveryAddress.state,
                postalCode: order.deliveryAddress.postalCode,
                country: order.deliveryAddress.country,
                addressType: order.deliveryAddress.addressType,
            },
            paymentIntentId: order.paymentIntentId,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
            items,
        }

        res.status(200).json({
            success: true,
            order: orderDetails,
        })
    } catch (error) {
        console.error('Error fetching order details:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order details.',
            error: error.message,
        })
    }
}

exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params
    const { status } = req.body 

    const validStatuses = ['pending', 'shipping', 'delivered', 'returned', 'cancelled']
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Allowed values are: pending, shipping, delivered, returned, cancelled.',
        })
    }

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true, runValidators: true }
        )

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found.',
            })
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully.',
            order: updatedOrder,
        })
    } catch (error) {
        console.error('Error updating order status:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to update order status.',
            error: error.message,
        })
    }
}