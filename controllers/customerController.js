const User = require('../models/User')
const Order = require('../models/Order')
const Review = require('../models/Review')
const Subscription = require('../models/Subscription')

exports.getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1 
        const limit = parseInt(req.query.limit) || 10 
        const skip = (page - 1) * limit

        const users = await User.find({}, { userFirstName: 1, userLastName: 1, email: 1 })
            .skip(skip)
            .limit(limit)

        const totalUsers = await User.countDocuments()

        const customerData = await Promise.all(
            users.map(async (user) => {
                const userId = user._id

                const totalOrderCount = await Order.countDocuments({ userId })

                const totalReviewCount = await Review.countDocuments({ userId })

                const subscription = await Subscription.findOne({ userId }, { status: 1 })

                return {
                    userId,
                    email: user.email,
                    fullName: `${user.userFirstName} ${user.userLastName}`,
                    totalOrderCount,
                    totalReviewCount,
                    subscriptionStatus: subscription ? subscription.status : null,
                }
            })
        )

        res.status(200).json({
            success: true,
            data: customerData,
            pagination: {
                totalUsers,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                limit,
            },
        })
    } catch (error) {
        console.error('Error fetching customer data:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer data.',
            error: error.message,
        })
    }
}


exports.searchCustomerById = async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is required",
            })
        }

        const user = await User.findById(id, { userFirstName: 1, userLastName: 1, email: 1 })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            })
        }

        const totalOrderCount = await Order.countDocuments({ userId: id })

        const totalReviewCount = await Review.countDocuments({ userId: id })

        const subscription = await Subscription.findOne({ userId: id }, { status: 1 })

        const customerData = {
            userId: user._id,
            email: user.email,
            fullName: `${user.userFirstName} ${user.userLastName}`,
            totalOrderCount,
            totalReviewCount,
            subscriptionStatus: subscription ? subscription.status : null,
        }

        res.status(200).json({
            success: true,
            data: customerData,
        })
    } catch (error) {
        console.error('Error fetching customer by ID:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer by ID.',
            error: error.message,
        })
    }
}