import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { Input } from '../../primitives/input/index.tsx';
import { FormField } from './index.tsx';

const meta = {
  title: 'Patterns/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Label + control + hint/error, wired for screen readers. Always use it instead of a bare Input in forms.',
      },
    },
  },
  args: { label: 'Email', children: <Input type="email" /> },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = {
  args: { hint: "We'll send a 6-digit code here." },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Email' });
    await expect(input).toHaveAccessibleDescription("We'll send a 6-digit code here.");
  },
};

export const WithError: Story = {
  args: {
    hint: 'Ignored when there is an error',
    error: 'Enter a valid email address.',
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: /Email/ });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription('Enter a valid email address.');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    await expect(canvas.queryByText('Ignored when there is an error')).not.toBeInTheDocument();
  },
};
