import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Label } from '../label/index.tsx';
import { Checkbox } from './index.tsx';

const meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox id="present" {...args} />
      <Label htmlFor="present">Present</Label>
    </div>
  ),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Toggle: Story = {
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Present' });
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await userEvent.click(within(canvasElement).getByText('Present'));
    await expect(box).not.toBeChecked();
  },
};

export const Indeterminate: Story = {
  args: { checked: 'indeterminate' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('checkbox')).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  },
};

export const Disabled: Story = { args: { disabled: true } };
