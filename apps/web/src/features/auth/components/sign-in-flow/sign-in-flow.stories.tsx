import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { SignInFlow, type RequestCodeResult, type VerifyResult } from './index';

const requestCode = (result: RequestCodeResult) => fn((_email: string) => Promise.resolve(result));
const verifyCode = (result: VerifyResult) =>
  fn((_email: string, _code: string) => Promise.resolve(result));

const meta = {
  title: 'Features/Auth/SignInFlow',
  component: SignInFlow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Email → 6-digit code sign-in (R1-ACC-01/02). Network calls are injected, so every state is testable.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-sm rounded-xl border border-border-subtle bg-surface p-8 shadow-md">
        <Story />
      </div>
    ),
  ],
  args: {
    onRequestCode: requestCode('sent'),
    onVerify: verifyCode('ok'),
  },
} satisfies Meta<typeof SignInFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmailStep: Story = {};

export const RejectsInvalidEmail: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Email' }), 'nope');
    await userEvent.click(canvas.getByRole('button', { name: 'Email me a code' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    await expect(args.onRequestCode).not.toHaveBeenCalled();
  },
};

export const CodeStepAndSuccess: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Email' }), '  Ana@School.com ');
    await userEvent.click(canvas.getByRole('button', { name: 'Email me a code' }));
    await expect(args.onRequestCode).toHaveBeenCalledWith('ana@school.com');
    await expect(await canvas.findByText(/ana@school\.com/)).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /Send a new code in 60s/ })).toBeDisabled();
    await userEvent.type(canvas.getByRole('textbox', { name: '6-digit code' }), '482913');
    await waitFor(() => expect(args.onVerify).toHaveBeenCalledWith('ana@school.com', '482913'));
  },
};

export const WrongCode: Story = {
  args: { onVerify: verifyCode('invalid') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Email' }), 'ana@school.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Email me a code' }));
    const code = await canvas.findByRole('textbox', { name: '6-digit code' });
    await userEvent.type(code, '000000');
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'This code is wrong or has expired.',
    );
    await expect(code).toHaveValue('');
  },
};

export const TooManyAttempts: Story = {
  args: { onVerify: verifyCode('too-many-attempts') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Email' }), 'ana@school.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Email me a code' }));
    await userEvent.type(await canvas.findByRole('textbox', { name: '6-digit code' }), '111111');
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Request a new code.',
    );
  },
};

export const RateLimited: Story = {
  args: { onRequestCode: requestCode('rate-limited') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Email' }), 'ana@school.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Email me a code' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Too many requests. Try again in a minute.',
    );
  },
};

export const ResendAfterCooldown: Story = {
  args: { resendCooldownSeconds: 1 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Email' }), 'ana@school.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Email me a code' }));
    const resend = await canvas.findByRole(
      'button',
      { name: 'Send a new code' },
      { timeout: 3000 },
    );
    await userEvent.click(resend);
    await expect(args.onRequestCode).toHaveBeenCalledTimes(2);
  },
};

export const French: Story = {
  globals: { locale: 'fr' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('heading', { name: 'Se connecter à Wan a Dance' }),
    ).toBeInTheDocument();
  },
};
