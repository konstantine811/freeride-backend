import { Router } from 'express'
import admin from 'firebase-admin'
import verifyFirebaseToken from '../middleware/auth'
import { AccessError, grantAdministrator } from '../services/adminAccess'

const router = Router()
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const database = admin.firestore()
    const member = await grantAdministrator(req.user?.uid, req.body?.email, {
      isOwner: async uid => (await database.doc(`owners/${uid}`).get()).exists,
      findUser: email => admin.auth().getUserByEmail(email),
      grantIfOwner: async (ownerUid, account) => {
        await database.runTransaction(async transaction => {
          // Recheck ownership within the write transaction to handle revocation.
          const owner = await transaction.get(database.doc(`owners/${ownerUid}`))
          if (!owner.exists) throw new AccessError(403, 'Доступ власника відкликано.')
          transaction.set(database.doc(`admins/${account.uid}`), { email: account.email, enabled: true })
        })
      },
    })
    res.json(member)
  } catch (error) {
    if (error instanceof AccessError) return res.status(error.status).json({ error: error.message })
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
    if (code === 'auth/user-not-found') return res.status(404).json({ error: 'Користувача не знайдено. Він має спочатку зареєструватися або увійти на сайт.' })
    console.error('Grant administrator failed', error)
    res.status(503).json({ error: 'Не вдалося надати доступ. Перевірте налаштування Firebase і повторіть спробу.' })
  }
})

export default router
