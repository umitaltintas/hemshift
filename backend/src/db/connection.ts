import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Test connection
pool.on('connect', () => {
  console.log('📊 Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err)
  process.exit(-1)
})

// Helper function for queries
export async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now()
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    console.log('[QUERY]', { text, duration: `${duration}ms`, rows: result.rowCount })
    return result
  } catch (error) {
    console.error('[QUERY ERROR]', { text, error })
    throw error
  }
}

export default pool
