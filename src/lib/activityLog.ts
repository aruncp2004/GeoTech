import { supabase } from '@/lib/supabase'

interface LogActivity {
  actor_id: string
  actor_name: string
  actor_role: string
  action: string
  target_id?: string
  target_name?: string
  target_role?: string
  details?: string
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
    })
  } catch {
    // Never crash the app because of logging failure
    console.error('Activity log failed')
  }
}

export function getActionIcon(action: string): string {
  if (action.includes('created')) return '✅'
  if (action.includes('deactivated')) return '🔴'
  if (action.includes('activated')) return '🟢'
  if (action.includes('role')) return '🔄'
  if (action.includes('password')) return '🔑'
  if (action.includes('reset')) return '📧'
  return '📋'
}

export function getActionColor(action: string): string {
  if (action.includes('created')) return 'text-green-700 bg-green-50'
  if (action.includes('deactivated')) return 'text-red-700 bg-red-50'
  if (action.includes('activated')) return 'text-green-700 bg-green-50'
  if (action.includes('role')) return 'text-purple-700 bg-purple-50'
  if (action.includes('password')) return 'text-orange-700 bg-orange-50'
  return 'text-blue-700 bg-blue-50'
}