import express from 'express'
import type { Request } from 'express'
import Video from '../models/Video'
import verifyFirebaseToken from '../middleware/auth'

const router = express.Router()

interface CreateVideoBody {
  title: string
  description?: string
  youtubeId?: string
}

// Public: list videos
router.get('/', async (req, res) => {
  const list = await Video.find().sort({ createdAt: -1 }).limit(20)
  res.json(list)
})

// Protected: create video entry (admin)
router.post('/', verifyFirebaseToken, async (req: Request<{}, unknown, CreateVideoBody>, res) => {
  try {
    const { title, description, youtubeId } = req.body
    const v = await Video.create({ title, description, youtubeId, createdBy: req.user!.uid })
    res.json(v)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
