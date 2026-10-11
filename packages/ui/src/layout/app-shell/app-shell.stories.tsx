import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CalendarDays, CreditCard, Home, Settings, Users } from 'lucide-react';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';
import { Avatar } from '../../primitives/avatar/index.tsx';
import { Badge } from '../../primitives/badge/index.tsx';
import { PageHeader } from '../../patterns/page-header/index.tsx';
import { AppShell, type NavItem } from './index.tsx';

const nav: NavItem[] = [
  { id: 'home', label: 'Home', href: '#', icon: <Home />, active: true },
  { id: 'schedule', label: 'Schedule', href: '#', icon: <CalendarDays /> },
  { id: 'members', label: 'Members', href: '#', icon: <Users />, badge: <Badge>128</Badge> },
  { id: 'credits', label: 'Credits', href: '#', icon: <CreditCard /> },
  { id: 'settings', label: 'Settings', href: '#', icon: <Settings /> },
];

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    nav,
    navLabel: 'Main',
    openNavLabel: 'Open navigation',
    closeNavLabel: 'Close navigation',
    header: (
      <div className="flex items-center gap-2">
        <Avatar name="Salsa Brussels" size="sm" />
        <span className="truncate font-semibold">Salsa Brussels</span>
      </div>
    ),
    footer: <span className="text-sm text-text-faint">Version 0.1.0</span>,
    children: <PageHeader title="Good evening, Ana" description="3 classes today" />,
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Main' });
    await expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

export const Mobile: Story = {
  tags: ['mobile'],
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open navigation' });
    await userEvent.click(trigger);
    const drawer = await screen.findByRole('dialog', { name: 'Main' });
    await waitFor(() =>
      expect(within(drawer).getByRole('navigation', { name: 'Main' })).toBeVisible(),
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('button', { name: 'Close navigation' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
