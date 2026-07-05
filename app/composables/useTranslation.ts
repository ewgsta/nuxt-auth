import en from '../locales/en.json'

type TranslationKeys = string

export const useTranslation = () => {
  const t = (key: TranslationKeys, replacements?: Record<string, string>): string => {
    const keys = key.split('.')
    let current: any = en

    for (const k of keys) {
      if (current[k] !== undefined) {
        current = current[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }

    if (typeof current !== 'string') {
        console.warn(`Translation key is not a string: ${key}`)
        return key
    }

    let result = current
    if (replacements) {
        for (const [key, value] of Object.entries(replacements)) {
            result = result.replace(`{${key}}`, value)
        }
    }
    return result
  }

  return { t }
}
