import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Plus } from 'lucide-react';
import { expect, within } from 'storybook/test';
import { Button } from '../../primitives/button/index.tsx';
import { PageHeader } from './index.tsx';

const meta = {
  title: 'Patterns/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  args: {
    title: 'Members',
    description: '128 students in Salsa Brussels',
    actions: (
      <Button>
        <Plus /> Add member
      </Button>
    ),
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('heading', { level: 1, name: 'Members' }),
    ).toBeInTheDocument();
  },
};
export const TitleOnly: Story = { args: { description: undefined, actions: undefined } };
