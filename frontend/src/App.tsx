import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏥 Shift Planner
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Hemşire Vardiya Planlama Sistemi
        </p>
        <div className="bg-white shadow-lg rounded-lg p-8">
          <p className="text-gray-700 mb-4">
            Proje başarıyla oluşturuldu!
          </p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            onClick={() => setCount((count) => count + 1)}
          >
            Count: {count}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Frontend boilerplate hazır. Development başlayabilir!
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
