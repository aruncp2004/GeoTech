export type UserManagementAction =
  | "create_admin"
  | "deactivate_user"
  | "reactivate_user"
  | "reset_password"
  | "create_customer"

export interface UserManagementPayload {
  action: UserManagementAction
  data: Record<string, unknown>
}

export async function invokeUserManagementAction<T = unknown>(
  action: UserManagementAction,
  data: Record<string, unknown>,
) {
  const response = await fetch(`/functions/v1/user-management`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, data }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || "Unable to complete user management request")
  }

  return (await response.json()) as T
}
