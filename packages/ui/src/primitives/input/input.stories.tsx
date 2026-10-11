import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Input } from './index.tsx';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  args: { placeholder: 'you@school.com', 'aria-label': 'Email' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = { args: { defaultValue: 'ana@school.com' } };
export const Invalid: Story = {
  args: { invalid: true, defaultValue: 'not-an-email' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};
export const Disabled: Story = { args: { disabled: true } };

export const Typing: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Email' });
    await userEvent.type(input, 'ana@school.com');
    await expect(input).toHaveValue('ana@school.com');
    await userEvent.clear(input);
    await expect(input).toHaveValue('');
  },
};
