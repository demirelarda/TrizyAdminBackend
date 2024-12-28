const Product = require('../models/Product')
const multer = require('multer')
const { uploadImagesToS3 } = require('../utils/uploadImages')
const { generateTags } = require('../ai/aiTagGenerator')
const storage = multer.memoryStorage()
const upload = multer({ storage })


exports.addProduct = [
  upload.array('images', 5),
async (req, res) => {
    try {
      const { title, description, price, category, stockCount, cargoWeight } = req.body

      if (!title || !description || !price || !category || !cargoWeight) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, price, category, and cargoWeight are required.',
        })
      }

      const tags = await generateTags(title, description, category)

      const imageURLs = await uploadImagesToS3(req.files, 'products')

      const newProduct = new Product({
        imageURLs,
        title,
        description,
        price,
        stockCount: stockCount || 0,
        category,
        tags,
        cargoWeight,
      })

      await newProduct.save()

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product: newProduct,
      })
    } catch (error) {
      console.error('Error adding product:', error)

      if (error.name === 'SyntaxError') {
        return res.status(500).json({
          success: false,
          message: 'Failed to parse AI response',
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add product',
        error: error.message,
      })
    }
  },
]


exports.getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query
        const skip = (page - 1) * limit

        const products = await Product.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))

        const totalProducts = await Product.countDocuments()

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total: totalProducts,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalProducts / limit),
                limit: parseInt(limit),
            },
        })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message })
    }
}