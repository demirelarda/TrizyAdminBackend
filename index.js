const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')

app.use(cors())
dotenv.config()

//const authRoute = require('./routes/auth')
const dealsRoute = require('./routes/deals')
const categoryRoute = require('./routes/categories')
const productsRoute = require('./routes/products')
const trialProductRoute = require('./routes/trialProducts')

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to the MongoDB")).catch((err) => { console.log(err) })


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
//app.use('/api', authRoute)
app.use('/api/deals', dealsRoute)
app.use('/api/categories', categoryRoute)
app.use('/api/products', productsRoute)
app.use('/api/trialProducts', trialProductRoute)


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)


  
})