import { useCallback } from 'react';

/**
 * Hook for centralized error handling and reporting
 * Catches and logs errors from async operations
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error: unknown, context: string = 'Operation') => {
    let errorMessage = 'Bilinmeyen hata oluştu';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Log to console for debugging
    console.error(`[${context}] Error:`, error);

    return {
      message: errorMessage,
      type: 'error' as const,
      context
    };
  }, []);

  const handleApiError = useCallback((error: unknown, operationName: string = 'API Call') => {
    if (error instanceof Error) {
      // Network error
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        return {
          message: 'Ağ bağlantı problemi. Lütfen interneti kontrol edin.',
          type: 'error' as const,
          isNetworkError: true
        };
      }

      // 4xx client errors
      if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
        return {
          message: 'İsteğiniz geçersiz veya yetkisiz.',
          type: 'error' as const,
          isClientError: true
        };
      }

      // 5xx server errors
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        return {
          message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyiniz.',
          type: 'error' as const,
          isServerError: true
        };
      }

      // Generic error
      return {
        message: error.message || `${operationName} sırasında hata oluştu`,
        type: 'error' as const
      };
    }

    return {
      message: `${operationName} sırasında bir hata oluştu`,
      type: 'error' as const
    };
  }, []);

  const createErrorNotification = useCallback((
    message: string,
    duration: number = 5000
  ) => {
    return {
      message,
      type: 'error' as const,
      duration
    };
  }, []);

  return {
    handleError,
    handleApiError,
    createErrorNotification
  };
};
