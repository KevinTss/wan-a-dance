import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CalendarDays, Home, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test';
import { Button } from '../../primitives/button/index.tsx';
import { CommandBar, useCommandBarShortcut, type CommandItem } from './index.tsx';

const goMembers = fn();

const items: CommandItem[] = [
  { id: 'home', label: 'Home', group: 'Go to', icon: <Home />, onSelect: fn() },
  {
    id: 'members',
    label: 'Members',
    group: 'Go to',
    icon: <Users />,
    keywords: ['students'],
    onSelect: goMembers,
  },
  { id: 'schedule', label: 'Schedule', group: 'Go to', icon: <CalendarDays />, onSelect: fn() },
  {
    id: 'settings',
    label: 'Settings',
    group: 'Actions',
    icon: <Settings />,
    shortcut: '⌘,',
    onSelect: fn(),
  },
];

function Demo() {
  const [open, setOpen] = useState(false);
  useCommandBarShortcut(() => setOpen((value) => !value));
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open (⌘K)
      </Button>
      <CommandBar
        open={open}
        onOpenChange={setOpen}
        items={items}
        title="Command bar"
        placeholder="Search or jump to…"
        emptyLabel="No results"
      />
    </>
  );
}

const meta = {
  title: 'Patterns/CommandBar',
  component: CommandBar,
  tags: ['autodocs'],
  args: {
    open: false,
    onOpenChange: fn(),
    items,
    title: 'Command bar',
    placeholder: 'Search or jump to…',
    emptyLabel: 'No results',
  },
  render: () => <Demo />,
} satisfies Meta<typeof CommandBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortcutSearchAndSelect: Story = {
  play: async () => {
    goMembers.mockClear();
    await userEvent.keyboard('{Meta>}k{/Meta}');
    const input = await screen.findByPlaceholderText('Search or jump to…');
    await userEvent.type(input, 'students');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    await userEvent.keyboard('{Enter}');
    await expect(goMembers).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

export const NoResults: Story = {
  play: async () => {
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(await screen.findByPlaceholderText('Search or jump to…'), 'zzzz');
    await expect(await screen.findByText('No results')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
  },
};
