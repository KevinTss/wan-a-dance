import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LogOut, Settings, Trash2 } from 'lucide-react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button/index.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './index.tsx';

const onSettings = fn();

const meta = {
  title: 'Primitives/DropdownMenu',
  component: DropdownMenuContent,
  tags: ['autodocs'],
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>ana@school.com</DropdownMenuLabel>
        <DropdownMenuItem icon={<Settings />} shortcut="⌘," onSelect={onSettings}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem icon={<Trash2 />} tone="danger" disabled>
          Delete school
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<LogOut />}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
} satisfies Meta<typeof DropdownMenuContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    onSettings.mockClear();
    const trigger = within(canvasElement).getByRole('button', { name: 'Account' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = await screen.findByRole('menu');
    await expect(within(menu).getByRole('menuitem', { name: /Delete school/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: /Settings/ })).toHaveFocus(),
    );
    await userEvent.keyboard('{Enter}');
    await expect(onSettings).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  },
};
