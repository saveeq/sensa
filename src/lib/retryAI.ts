type RetryOptions = {
  retries: number
  onRetry?: (attempt: number) => void
}

export const retry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  let lastError

  for (let attempt = 1; attempt <= options.retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      options.onRetry?.(attempt)
    }
  }

  throw lastError
}