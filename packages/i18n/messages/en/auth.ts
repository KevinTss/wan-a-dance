export default {
  signIn: {
    title: 'Sign in to Wan a Dance',
    subtitle: "We'll email you a 6-digit code. No password needed.",
    emailLabel: 'Email',
    emailPlaceholder: 'you@school.com',
    submit: 'Email me a code',
  },
  verify: {
    title: 'Check your email',
    subtitle: 'Enter the 6-digit code we sent to {email}.',
    codeLabel: '6-digit code',
    submit: 'Sign in',
    resend: 'Send a new code',
    resendIn: 'Send a new code in {seconds}s',
    changeEmail: 'Use another email',
  },
  errors: {
    invalidEmail: 'Enter a valid email address.',
    invalidCode: 'This code is wrong or has expired.',
    tooManyAttempts: 'Too many attempts. Request a new code.',
    rateLimited: 'Too many requests. Try again in a minute.',
  },
};
