import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const options = [
  { key: 'system', icon: Monitor, labelEn: 'System', labelFr: 'Système', labelAr: 'النظام' },
  { key: 'light',  icon: Sun,     labelEn: 'Light',  labelFr: 'Clair',   labelAr: 'فاتح' },
  { key: 'dark',   icon: Moon,    labelEn: 'Dark',   labelFr: 'Sombre',  labelAr: 'داكن' },
];

export default function ThemeToggle({ lang = 'fr' }) {
  const { theme, effectiveTheme, changeTheme } = useTheme();

  const label = (opt) => lang === 'ar' ? opt.labelAr : lang === 'fr' ? opt.labelFr : opt.labelEn;

  const CurrentIcon = effectiveTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title={lang === 'ar' ? 'السمة' : lang === 'fr' ? 'Thème' : 'Theme'}
        >
          <CurrentIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {options.map(({ key, icon: Icon }) => (
          <DropdownMenuItem
            key={key}
            onClick={() => changeTheme(key)}
            className={`min-h-[40px] flex items-center gap-2 text-sm ${theme === key ? 'text-emerald-600 font-semibold' : ''}`}
          >
            <Icon className="w-4 h-4" />
            {label({ labelEn: key === 'system' ? 'System' : key === 'light' ? 'Light' : 'Dark', labelFr: key === 'system' ? 'Système' : key === 'light' ? 'Clair' : 'Sombre', labelAr: key === 'system' ? 'النظام' : key === 'light' ? 'فاتح' : 'داكن' })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}