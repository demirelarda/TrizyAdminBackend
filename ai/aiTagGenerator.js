const fs = require('fs')
const path = require('path')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const aiModel = "gemini-1.5-flash"

const generateSystemPrompt = () => {
  const filePath = path.join(__dirname, '../prompts/productTagGeneratorSystemPrompt.txt')
  return fs.readFileSync(filePath, 'utf8')
}

const generateUserPrompt = (placeholders) => {
  const { title, description, category } = placeholders
  const filePath = path.join(__dirname, '../prompts/userPromptTagGenerator.txt')
  let userPrompt = fs.readFileSync(filePath, 'utf8')
  userPrompt = userPrompt.replace('{title}', title)
  userPrompt = userPrompt.replace('{description}', description)
  userPrompt = userPrompt.replace('{category}', category)
  return userPrompt
}

const generateTags = async (title, description, category) => {
  const systemPrompt = generateSystemPrompt()
  const userPrompt = generateUserPrompt({
    title,
    description,
    category
  })

  const model = genAI.getGenerativeModel({
    model: aiModel,
    systemInstruction: systemPrompt,
  })

  console.log("Generating tags...")
  const result = await model.generateContent(userPrompt)
  const response = await result.response
  let text = await response.text()

  text = text.replace(/```json|```/g, '').trim()
  const jsonResponse = JSON.parse(text)

  console.log("Generated Tags With AI: ", jsonResponse)
  return jsonResponse.tags.split(',').map((tag) => tag.trim())
}

module.exports = { generateTags }