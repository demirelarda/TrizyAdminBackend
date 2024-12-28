const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid')

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const uploadImagesToS3 = async (files, folderName) => {
  const uploadPromises = files.map(async (file) => {
    const fileName = `${folderName}/${uuidv4()}_${file.originalname}`
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

module.exports = { uploadImagesToS3 }