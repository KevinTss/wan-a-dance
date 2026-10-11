import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Input } from '../input/index.tsx';
import { Label } from './index.tsx';

const meta = { title: 'Primitives/Label', component: Label, tags: ['autodocs'] } satisfies Meta<
  typeof Label
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusesItsControl: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="school-name">School name</Label>
      <Input id="school-name" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('School name'));
    await expect(canvas.getByRole('textbox', { name: 'School name' })).toHaveFocus();
  },
};
