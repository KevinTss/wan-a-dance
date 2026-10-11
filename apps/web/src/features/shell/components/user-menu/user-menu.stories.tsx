import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { UserMenu } from './index';

const meta = {
  title: 'Features/Shell/UserMenu',
  component: UserMenu,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-60 pt-80">
        <Story />
      </div>
    ),
  ],
  args: {
    name: 'Ana Martínez',
    email: 'ana@school.com',
    theme: 'system',
    locale: 'en',
    onThemeChange: fn(),
    onLocaleChange: fn(),
    onSignOut: fn(),
  },
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const ChangeThemeLanguageAndSignOut: Story = {
  play: async ({ args, canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /Account menu/ });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Dark' }));
    await expect(args.onThemeChange).toHaveBeenCalledWith('dark');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Français' }));
    await expect(args.onLocaleChange).toHaveBeenCalledWith('fr');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
    await expect(args.onSignOut).toHaveBeenCalledTimes(1);
  },
};

export const EmailOnly: Story = { args: { name: '' } };
