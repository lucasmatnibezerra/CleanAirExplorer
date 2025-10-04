/// <reference types="vitest" />
import { render, fireEvent } from '@testing-library/react';
import { DarkModeToggle } from '../dark-mode-toggle';

function getHtmlClassList(){
  return Array.from(document.documentElement.classList.values());
}

describe('DarkModeToggle', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });
  it('toggles dark class and persists', () => {
    const { getByRole } = render(<DarkModeToggle />);
    const btn = getByRole('button', { name: /alternar modo/i });
    expect(getHtmlClassList()).not.toContain('dark');
    fireEvent.click(btn);
    expect(getHtmlClassList()).toContain('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    fireEvent.click(btn);
    expect(getHtmlClassList()).not.toContain('dark');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
