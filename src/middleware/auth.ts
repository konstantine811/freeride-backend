import admin from 'firebase-admin'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import type { RequestHandler } from 'express'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function initFirebase() {
  if (admin.apps.length) return true
  const servicePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
  const fullPath = path.isAbsolute(servicePath) ? servicePath : path.join(process.cwd(), servicePath)
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON || readFileSync(fullPath, 'utf8')
      ))
    })
    return true
  } catch (e) {
    console.warn('Firebase admin init failed:', errorMessage(e))
    console.warn('Set FIREBASE_SERVICE_ACCOUNT_PATH to an existing service account JSON file, or set FIREBASE_SERVICE_ACCOUNT_JSON. Protected routes will return 503 until Firebase is configured.')
    return false
  }
}

const firebaseReady = initFirebase()

const verifyFirebaseToken: RequestHandler = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })
  if (!firebaseReady) return res.status(503).json({ error: 'Authentication service is not configured' })
  const idToken = auth.split(' ')[1]
  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    req.user = decoded
    next()
  } catch (err) {
    console.error('Token verify error', errorMessage(err))
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export default verifyFirebaseToken
