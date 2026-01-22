import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = Readonly<{
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}>

type ThemeProviderState = {
    theme: Theme
    resolvedTheme: "light" | "dark"
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

const EDITOR_BACKGROUND = {
    light: "#ffffff",
    dark: "#262626",
} as const

const getSystemTheme = (): "light" | "dark" => {
    if (globalThis.window !== undefined) {
        return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
    }
    return "light"
}

const resolveTheme = (theme: Theme): "light" | "dark" => {
    if (theme === "system") {
        return getSystemTheme()
    }
    return theme
}

const applyEditorBackground = (resolvedTheme: "light" | "dark") => {
    const root = document.documentElement
    const backgroundColor = EDITOR_BACKGROUND[resolvedTheme]
    root.style.setProperty("--color-editor-background", backgroundColor)

    try {
        const displaySettings = localStorage.getItem("editor-display-settings")
        if (displaySettings) {
            const settings = JSON.parse(displaySettings)
            settings.editorBackgroundColor = backgroundColor
            localStorage.setItem("editor-display-settings", JSON.stringify(settings))
        }
    } catch {
    }
}

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
        resolveTheme((localStorage.getItem(storageKey) as Theme) || defaultTheme)
    )

    useEffect(() => {
        const root = globalThis.document.documentElement
        const resolved = resolveTheme(theme)

        root.classList.remove("light", "dark")
        root.classList.add(resolved)

        setResolvedTheme(resolved)
        applyEditorBackground(resolved)
    }, [theme])

    useEffect(() => {
        const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)")

        const handleChange = () => {
            if (theme === "system") {
                const systemTheme = getSystemTheme()
                const root = globalThis.document.documentElement

                root.classList.remove("light", "dark")
                root.classList.add(systemTheme)

                setResolvedTheme(systemTheme)
                applyEditorBackground(systemTheme)
            }
        }

        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [theme])

    const handleSetTheme = useCallback((newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme)
        setTheme(newTheme)
    }, [storageKey])

    const value = useMemo(() => ({
        theme,
        resolvedTheme,
        setTheme: handleSetTheme,
    }), [theme, resolvedTheme, handleSetTheme])

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}