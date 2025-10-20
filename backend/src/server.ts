import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler.js'

// Import routes
import nursesRoutes from './routes/nurses.js'
import leavesRoutes from './routes/leaves.js'
import schedulesRoutes from './routes/schedules.js'
import shiftsRoutes from './routes/shifts.js'
import statsRoutes from './routes/stats.js'

// Load environment variables
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Shift Planner API v1.0',
    docs: '/api/docs',
    endpoints: {
      nurses: '/api/nurses',
      leaves: '/api/leaves',
      schedules: '/api/schedules',
      shifts: '/api/shifts',
      stats: '/api/stats'
    }
  })
})

// Mount routes
app.use('/api/nurses', nursesRoutes)
app.use('/api/leaves', leavesRoutes)
app.use('/api/schedules', schedulesRoutes)
app.use('/api/shifts', shiftsRoutes)
app.use('/api/stats', statsRoutes)

// Error handler (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📚 API available at http://localhost:${PORT}/api`)
  console.log(`💚 Health check at http://localhost:${PORT}/health`)
})

export default app
