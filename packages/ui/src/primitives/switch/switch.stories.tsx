import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Label } from '../label/index.tsx';
import { Switch } from './index.tsx';

const meta = {
  title: 'Primitives/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: { onCheckedChange: fn() },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch id="auto-leads" {...args} />
      <Label htmlFor="auto-leads">Create leads automatically</Label>
    </div>
  ),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Toggle: Story = {
  play: async ({ args, canvasElement }) => {
    const control = within(canvasElement).getByRole('switch', {
      name: 'Create leads automatically',
    });
    await userEvent.click(control);
    await expect(control).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
    await userEvent.keyboard(' ');
    await expect(control).not.toBeChecked();
  },
};

export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
