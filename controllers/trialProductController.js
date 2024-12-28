const TrialProduct = require('../models/TrialProduct')
const multer = require('multer')
const { uploadImagesToS3 } = require('../utils/uploadImages')
const { generateTags } = require('../ai/aiTagGenerator')
const storage = multer.memoryStorage()
const upload = multer({ storage })

exports.addTrialProduct = [
  upload.array('images', 5),
  async (req, res) => {
    try {
      const { title, description, trialPeriod, availableCount, category } = req.body

      if (!title || !description || !trialPeriod || !availableCount || !category) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, trialPeriod, availableCount, and category are required.',
        })
      }

      const tags = await generateTags(
        title,
        description,
        category
      )

      const imageURLs = await uploadImagesToS3(req.files, 'trial-products')

      const newTrialProduct = new TrialProduct({
        imageURLs,
        title,
        description,
        trialPeriod,
        availableCount,
        category,
        tags,
      })

      await newTrialProduct.save()

      res.status(201).json({
        success: true,
        message: 'Trial product created successfully',
        trialProduct: newTrialProduct,
      })
    } catch (error) {
      console.error('Error adding trial product:', error)

      if (error.name === 'SyntaxError') {
        return res.status(500).json({
          success: false,
          message: 'Failed to parse AI response',
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add trial product',
        error: error.message,
      })
    }
  },
]