import { supabase } from '@/lib/supabase'

export interface LogActivity {
  actor_id: string
  actor_name: string
  actor_role: string
  action: string
  target_id?: string
  target_name?: string
  target_role?: string
  details?: string
  old_value?: string
  new_value?: string
  sample_id?: string
  page?: string
}

export interface FieldChange {
  field: string
  old_value: string
  new_value: string
}

// Compare two objects and return list of changes
export function detectChanges<T extends Record<string, unknown>>(
  oldData: T,
  newData: T,
  fieldLabels?: Record<string, string>
): FieldChange[] {
  const changes: FieldChange[] = []
  for (const key of Object.keys(newData)) {
    const oldVal = String(oldData[key] ?? '')
    const newVal = String(newData[key] ?? '')
    if (oldVal !== newVal) {
      changes.push({
        field: fieldLabels?.[key] || key,
        old_value: oldVal || '(empty)',
        new_value: newVal || '(empty)',
      })
    }
  }
  return changes
}

export function formatChanges(changes: FieldChange[]): string {
  return changes
    .map(c => `${c.field}: "${c.old_value}" → "${c.new_value}"`)
    .join(' | ')
}

export async function logActivity(log: LogActivity): Promise<void> {
  try {
    await supabase.from('activity_logs').insert({
      created_at: new Date().toISOString(),
      actor_id: log.actor_id,
      actor_name: log.actor_name,
      actor_role: log.actor_role,
      action: log.action,
      target_id: log.target_id || null,
      target_name: log.target_name || null,
      target_role: log.target_role || null,
      details: log.details || null,
      old_value: log.old_value || null,
      new_value: log.new_value || null,
      sample_id: log.sample_id || null,
      page: log.page || null,
    })
  } catch {
    console.error('Activity log failed — action:', log.action)
  }
}

export function getActionIcon(action: string): string {
  if (action.includes('created')) return '+'
  if (action.includes('deactivated')) return 'x'
  if (action.includes('activated')) return 'v'
  if (action.includes('role')) return '~'
  if (action.includes('password')) return '*'
  if (action.includes('reset')) return 'r'
  if (action.includes('edited') || action.includes('updated')) return 'e'
  if (action.includes('deleted') || action.includes('removed')) return '-'
  if (action.includes('submitted') || action.includes('created sample')) return '^'
  return '.'
}

export function getActionColor(action: string): string {
  if (action.includes('created') && !action.includes('sample')) return 'text-green-700 bg-green-50'
  if (action.includes('created sample') || action.includes('submitted')) return 'text-blue-700 bg-blue-50'
  if (action.includes('deactivated')) return 'text-red-700 bg-red-50'
  if (action.includes('activated')) return 'text-green-700 bg-green-50'
  if (action.includes('role')) return 'text-purple-700 bg-purple-50'
  if (action.includes('password')) return 'text-orange-700 bg-orange-50'
  if (action.includes('edited') || action.includes('updated')) return 'text-yellow-700 bg-yellow-50'
  if (action.includes('deleted') || action.includes('removed')) return 'text-red-700 bg-red-50'
  return 'text-gray-700 bg-gray-50'
}

export function getRoleLabel(role: string): string {
  if (role === 'super_admin') return 'Super Admin'
  if (role === 'admin') return 'Admin'
  if (role === 'customer') return 'Supervisor'
  return role
}

export function getRoleBadgeColor(role: string): string {
  if (role === 'super_admin') return 'bg-purple-100 text-purple-700'
  if (role === 'admin') return 'bg-blue-100 text-blue-700'
  return 'bg-green-100 text-green-700'
}