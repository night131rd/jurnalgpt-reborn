import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Framer Motion - it often causes issues in JSDOM tests
vi.mock('framer-motion', async (importOriginal) => {
    const actual = await importOriginal<typeof import('framer-motion')>()
    return {
        ...actual,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
        motion: {
            ...actual.motion,
            div: ({ children, ...props }: any) => <div { ...props } > { children } </div>,
      span: ({ children, ...props }: any) => <span { ...props } > { children } </span>,
      p: ({ children, ...props }: any) => <p { ...props } > { children } </p>,
        },
    }
})
