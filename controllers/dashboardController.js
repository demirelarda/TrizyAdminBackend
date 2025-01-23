const User = require('../models/User')
const Subscription = require('../models/Subscription')
const Order = require('../models/Order')
const Review = require('../models/Review')
const Product = require('../models/Product')

const getTotalUsers = async () => {
    return await User.countDocuments()
}

const getTotalSubscribers = async () => {
    return await Subscription.countDocuments({ isActive: true })
}

const getTotalSalesAmount = async () => {
    const totalSalesAmount = await Order.aggregate([
        {
            $match: {
                status: { $in: ['pending', 'shipping', 'delivered'] },
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
            },
        },
    ])

    return totalSalesAmount.length > 0 ? totalSalesAmount[0].totalAmount : 0
}

const getSalesInLast24h = async () => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const totalSalesLast24h = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: last24h },
                status: { $in: ['pending', 'shipping', 'delivered'] },
            },
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
            },
        },
    ])

    return totalSalesLast24h.length > 0 ? totalSalesLast24h[0].totalAmount : 0
}

const getUsersInLast24h = async () => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return await User.countDocuments({ createdAt: { $gte: last24h } })
}

const getSubscribersInLast24h = async () => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return await Subscription.countDocuments({
        isActive: true,
        createdAt: { $gte: last24h },
    })
}

const getLatestReviews = async () => {
    const latestReviews = await Review.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('productId', 'title')
        .populate('userId', 'userFirstName')

    return latestReviews.map((review) => ({
        productName: review.productId.title,
        userFirstName: review.userId.userFirstName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
    }))
}

const getRecentSubscribers = async () => {
    const recentSubscribers = await Subscription.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('userId', 'userFirstName userLastName email')

    return recentSubscribers.map((subscription) => ({
        ...subscription.toObject(),
        fullName: `${subscription.userId.userFirstName} ${subscription.userId.userLastName}`,
        email: subscription.userId.email,
    }))
}

exports.getDashboardData = async (req, res) => {
    try {
        const [
            totalUsers,
            totalSubscribers,
            totalSalesAmount,
            salesInLast24h,
            usersInLast24h,
            subscribersInLast24h,
            latestReviews,
            recentSubscribers,
        ] = await Promise.all([
            getTotalUsers(),
            getTotalSubscribers(),
            getTotalSalesAmount(),
            getSalesInLast24h(),
            getUsersInLast24h(),
            getSubscribersInLast24h(),
            getLatestReviews(),
            getRecentSubscribers(),
        ])

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalSubscribers,
                totalSalesAmount,
                salesInLast24h,
                usersInLast24h,
                subscribersInLast24h,
                latestReviews,
                recentSubscribers,
            },
        })
    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data.',
            error: error.message,
        })
    }
}