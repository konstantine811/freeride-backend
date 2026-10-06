import mongoose from 'mongoose'

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  youtubeId: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String }
})

export default mongoose.model('Video', VideoSchema)
