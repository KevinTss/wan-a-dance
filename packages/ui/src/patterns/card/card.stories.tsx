import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '../../primitives/button/index.tsx';
import { Card } from './index.tsx';

const meta = {
  title: 'Patterns/Card',
  component: Card,
  tags: ['autodocs'],
  args: { children: 'Card content' },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};
export const WithHeader: Story = {
  args: {
    title: 'This week',
    description: '12 classes, 184 attendances',
    actions: (
      <Button variant="ghost" size="sm">
        View all
      </Button>
    ),
  },
};
