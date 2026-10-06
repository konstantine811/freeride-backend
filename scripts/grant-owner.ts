import 'dotenv/config'
import '../src/middleware/auth'
import admin from 'firebase-admin'

async function main() {
  const email = process.argv[2]
  if (!email) throw new Error('Usage: npm run owner:grant -- user@example.com')
  const user = await admin.auth().getUserByEmail(email)
  if (user.disabled) throw new Error('Account is disabled')
  await admin.firestore().doc(`owners/${user.uid}`).set({ label: user.email }, { merge: true })
  console.log(`Owner access granted to ${user.email} (${user.uid})`)
}

main().catch(error => {
  console.error('Owner access was not granted:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}).finally(async () => {
  await Promise.all(admin.apps.map(app => app?.delete()))
})
