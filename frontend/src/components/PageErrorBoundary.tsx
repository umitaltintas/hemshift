import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageTitle?: string;
}

/**
 * Page-level error boundary with enhanced error UI for page failures
 */
export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children, pageTitle = 'Sayfa' }) => {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
            {/* Header */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7m0 0H7m0 0a5 5 0 1110 0M7 12a5 5 0 1110 0" />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {pageTitle} Yüklenemedi
            </h1>
            <p className="text-gray-600 text-center mb-6">
              {pageTitle} yüklenirken bir hata oluştu. Lütfen yeniden deneyiniz.
            </p>

            {/* Error Details */}
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-900 mb-2">Hata Mesajı:</p>
              <code className="text-xs text-red-700 break-words font-mono">
                {error.message || 'Bilinmeyen hata'}
              </code>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={retry}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              >
                Yeniden Dene
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Anasayfa
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Sorun devam ederse, lütfen sayfayı yenileyiniz veya daha sonra tekrar deneyiniz.
            </p>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
