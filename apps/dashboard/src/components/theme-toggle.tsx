import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { IconButton, Tooltip } from '@radix-ui/themes';
import { useTheme } from 'next-themes';

export const ThemeToggle = () => {
  const { theme, systemTheme, setTheme } = useTheme();

  return (
    <>
      <style>
        {`:root, .light, .light-theme {
          --theme-toggle-sun-icon-display: block;
          --theme-toggle-moon-icon-display: none;
        }
        .dark, .dark-theme {
          --theme-toggle-sun-icon-display: none;
          --theme-toggle-moon-icon-display: block;
        }`}
      </style>
      <Tooltip content="Toggle theme" delayDuration={300}>
        <IconButton
          size="2"
          variant="ghost"
          color="gray"
          style={{ borderRadius: '50%' }}
          onClick={() => {
            const resolvedTheme = theme === 'system' ? systemTheme : theme;
            const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
            const newThemeMatchesSystem = newTheme === systemTheme;
            setTheme(newThemeMatchesSystem ? 'system' : newTheme);
          }}
        >
          <SunIcon width="16" height="16" style={{ display: 'var(--theme-toggle-sun-icon-display)' }} />
          <MoonIcon width="16" height="16" style={{ display: 'var(--theme-toggle-moon-icon-display)' }} />
        </IconButton>
      </Tooltip>
    </>
  );
};
