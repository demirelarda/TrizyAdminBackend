const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid')
const sharp = require('sharp')

const ENABLE_COMPRESSION = true

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const compressImageToSize = async (buffer, maxSizeKB = 800, maxWidth = 800) => {
  let quality = 80
  let compressedBuffer = buffer

  while (quality > 10) {
    try {
      compressedBuffer = await sharp(buffer)
        .resize(maxWidth) 
        .jpeg({ quality }) 
        .toBuffer()

      const sizeInKB = compressedBuffer.length / 1024
      if (sizeInKB <= maxSizeKB) {
        return compressedBuffer
      }

      quality -= 5
    } catch (error) {
      console.error('Error compressing image:', error)
      throw new Error('Image compression failed')
    }
  }

  console.warn('Could not compress image below target size, returning last compressed version.')
  return compressedBuffer
}

const uploadImagesToS3 = async (files, folderName) => {
  const uploadPromises = files.map(async (file) => {
    const bufferToUpload = ENABLE_COMPRESSION
      ? await compressImageToSize(file.buffer)
      : file.buffer

    const fileName = `${folderName}/${uuidv4()}_${file.originalname}`
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: bufferToUpload, 
      ContentType: 'image/jpeg', 
    }

    await s3Client.send(new PutObjectCommand(params))
    return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`
  })

  return Promise.all(uploadPromises)
}

module.exports = { uploadImagesToS3 }