import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/freeride'

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err))

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Backend running on ${port}`))
