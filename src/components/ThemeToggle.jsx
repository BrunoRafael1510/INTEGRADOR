import Icon from './Icon'

export default function ThemeToggle({ theme = 'light', onThemeToggle, compact = false }) {
  return (
    <button
      onClick={onThemeToggle}
      className="theme-toggle inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/80 px-2.5 py-2 text-xs font-medium text-stone-500 transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
      title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      type="button"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-4 w-4" />
      {!compact && <span className="hidden sm:inline">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>}
    </button>
  )
}
