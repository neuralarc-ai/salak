/**
 * Database initialization utility
 * Checks and ensures all required tables exist
 */

import { createServerClient } from './supabase'

export interface TableStatus {
  name: string
  exists: boolean
  error?: string
}

/**
 * Check if a table exists in the database
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
    
    // If error is PGRST116, table doesn't exist
    if (error && error.code === 'PGRST116') {
      return false
    }
    
    // If error is PGRST205, schema cache issue
    if (error && error.code === 'PGRST205') {
      console.warn(`Schema cache issue for table ${tableName}. Tables may need to be created.`)
      return false
    }
    
    // If no error or other error, assume table exists
    return !error
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error)
    return false
  }
}

/**
 * Check all required tables
 */
export async function checkAllTables(): Promise<TableStatus[]> {
  const requiredTables = ['users', 'documents', 'categories', 'document_versions', 'system_logs']
  const results: TableStatus[] = []

  for (const table of requiredTables) {
    const exists = await checkTableExists(table)
    results.push({
      name: table,
      exists,
    })
  }

  return results
}

/**
 * Get SQL setup script content
 */
export function getSetupSQL(): string {
  // This will be read from the file at runtime
  return ''
}

/**
 * Verify database is ready
 */
export async function verifyDatabaseReady(): Promise<{
  ready: boolean
  missingTables: string[]
  message: string
}> {
  const tables = await checkAllTables()
  const missingTables = tables.filter(t => !t.exists).map(t => t.name)

  if (missingTables.length === 0) {
    return {
      ready: true,
      missingTables: [],
      message: 'All tables are ready',
    }
  }

  return {
    ready: false,
    missingTables,
    message: `Missing tables: ${missingTables.join(', ')}. Please run the SQL setup script in Supabase.`,
  }
}

