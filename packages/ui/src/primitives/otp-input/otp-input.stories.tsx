import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { OtpInput, type OtpInputProps } from './index.tsx';

function Controlled(props: Omit<OtpInputProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState('');
  return <OtpInput {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: 'Primitives/OtpInput',
  component: OtpInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Six-digit sign-in code. Accepts paste and numeric input only, and triggers `onComplete` on the last digit.',
      },
    },
  },
  args: { label: '6-digit code', value: '', onChange: fn(), onComplete: fn() },
  render: (args) => (
    <Controlled
      label={args.label}
      invalid={args.invalid}
      disabled={args.disabled}
      onComplete={args.onComplete}
    />
  ),
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };

export const TypeDigitsOnly: Story = {
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: '6-digit code' });
    await userEvent.click(input);
    await userEvent.keyboard('12ab34');
    await expect(input).toHaveValue('1234');
    await userEvent.keyboard('56');
    await expect(input).toHaveValue('123456');
    await expect(args.onComplete).toHaveBeenCalledWith('123456');
  },
};

export const Paste: Story = {
  play: async ({ args, canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: '6-digit code' });
    await userEvent.click(input);
    await userEvent.paste('482913');
    await expect(input).toHaveValue('482913');
    await expect(args.onComplete).toHaveBeenCalledWith('482913');
  },
};
