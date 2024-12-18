const Product = require('../models/Product')
const multer = require('multer')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid')
const { GoogleGenerativeAI } = require("@google/generative-ai")
const fs = require('fs')
const path = require('path')

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const aiModel = "gemini-1.5-flash"

const storage = multer.memoryStorage()
const upload = multer({ storage })

function generateSystemPrompt() {
  const filePath = path.join(__dirname, '../prompts/productTagGeneratorSystemPrompt.txt')
  return fs.readFileSync(filePath, 'utf8')
}

function generateUserPrompt(title, description, price, category) {
  const filePath = path.join(__dirname, '../prompts/userPromptTagGenerator.txt')
  let userPrompt = fs.readFileSync(filePath, 'utf8')
  userPrompt = userPrompt.replace('{title}', title)
  userPrompt = userPrompt.replace('{description}', description)
  userPrompt = userPrompt.replace('{price}', price)
  userPrompt = userPrompt.replace('{category}', category)
  return userPrompt
}

const uploadImagesToS3 = async (files) => {
  const uploadPromises = files.map(async (file) => {
    const fileName = `products/${uuidv4()}_${file.originalname}`
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    }

    await s3Client.send(new PutObjectCommand(params))
    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`
  })

  return Promise.all(uploadPromises)
}

exports.addProduct = [
  upload.array('images', 5), // accept up to 5 images
  async (req, res) => {
    try {
      const { title, description, price, category, stockCount, cargoWeight } = req.body

      if (!title || !description || !price || !category || !cargoWeight) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, price, category, and cargoWeight are required.',
        })
      }

      const systemPrompt = generateSystemPrompt()
      const userPrompt = generateUserPrompt(title, description, price, category)
      const model = genAI.getGenerativeModel({
        model: aiModel,
        systemInstruction: systemPrompt,
      })
      console.log("Genarating tags...")
      const result = await model.generateContent(userPrompt)
      const response = await result.response
      let text = await response.text()

      text = text.replace(/```json|```/g, '').trim()
      const jsonResponse = JSON.parse(text)
      console.log("Generated Tags With AI: ",jsonResponse)
      const tags = jsonResponse.tags.split(',').map(tag => tag.trim())

      const imageURLs = await uploadImagesToS3(req.files)

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