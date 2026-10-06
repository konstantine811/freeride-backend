import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AccessError, grantAdministrator, type AdminAccessDependencies } from '../src/services/adminAccess'

function dependencies(): AdminAccessDependencies {
  return {
    isOwner: async uid => uid === 'owner',
    findUser: async email => ({ uid: 'resolved-uid', email, disabled: false }),
    grantIfOwner: async () => {},
  }
}

test('guests and non-owners cannot look up accounts or grant roles', async () => {
  const deps = dependencies()
  deps.findUser = async () => { throw new Error('Account lookup must not happen') }
  for (const [uid, status] of [[undefined, 401], ['editor', 403]] as const) {
    await assert.rejects(grantAdministrator(uid, 'user@example.com', deps), error => error instanceof AccessError && error.status === status)
  }
})

test('owner grants access to resolved UID using normalized email', async () => {
  const deps = dependencies()
  let written: unknown
  deps.grantIfOwner = async (uid, account) => { written = { uid, account } }
  const account = await grantAdministrator('owner', ' User@Example.com ', deps)
  assert.deepEqual(account, { uid: 'resolved-uid', email: 'user@example.com' })
  assert.deepEqual(written, { uid: 'owner', account })
})

test('invalid email, missing account and disabled accounts never get roles', async () => {
  const deps = dependencies()
  deps.grantIfOwner = async () => { assert.fail('Must not grant a role') }
  await assert.rejects(grantAdministrator('owner', 'bad-address', deps), AccessError)
  deps.findUser = async () => { throw Object.assign(new Error('Missing account'), { code: 'auth/user-not-found' }) }
  await assert.rejects(grantAdministrator('owner', 'user@example.com', deps), { code: 'auth/user-not-found' })
  deps.findUser = async email => ({ uid: 'disabled', email, disabled: true })
  await assert.rejects(grantAdministrator('owner', 'user@example.com', deps), AccessError)
})

test('revoked ownership at commit prevents granting access', async () => {
  const deps = dependencies()
  deps.grantIfOwner = async () => { throw new AccessError(403, 'Ownership revoked') }
  await assert.rejects(grantAdministrator('owner', 'user@example.com', deps), error => error instanceof AccessError && error.status === 403)
})
