export class AccessError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

interface Account { uid: string; email?: string; disabled: boolean }
export interface AdminAccessDependencies {
  isOwner(uid: string): Promise<boolean>
  findUser(email: string): Promise<Account>
  grantIfOwner(ownerUid: string, account: { uid: string; email: string }): Promise<void>
}

export async function grantAdministrator(ownerUid: string | undefined, email: unknown, dependencies: AdminAccessDependencies) {
  if (!ownerUid) throw new AccessError(401, 'Спочатку увійдіть у свій акаунт.')
  if (!await dependencies.isOwner(ownerUid)) throw new AccessError(403, 'Додавати адміністраторів може тільки власник.')
  if (typeof email !== 'string' || email.trim().length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new AccessError(400, 'Вкажіть коректну адресу email.')
  }
  const account = await dependencies.findUser(email.trim().toLowerCase())
  if (account.disabled) throw new AccessError(400, 'Цей акаунт вимкнений у Firebase.')
  if (!account.email) throw new AccessError(400, 'Акаунт не має email.')
  const member = { uid: account.uid, email: account.email }
  await dependencies.grantIfOwner(ownerUid, member)
  return member
}
