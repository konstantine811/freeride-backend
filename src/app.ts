import express from 'express'
import cors from 'cors'
import videosRouter from './routes/videos'
import adminsRouter from './routes/admins'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/videos', videosRouter)
app.use('/api/admins', adminsRouter)
app.get('/', (_req, res) => res.json({ ok: true }))

export default app
