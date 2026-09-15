import '@testing-library/jest-dom'

// Mock robusto de ResizeObserver compatible con el operador `new`
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)