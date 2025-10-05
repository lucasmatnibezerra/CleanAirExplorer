import '@testing-library/jest-dom'
import { ensureTestI18n } from './src/test/test-i18n'

// Initialize isolated i18n instance once for all tests to silence react-i18next warnings.
ensureTestI18n()
