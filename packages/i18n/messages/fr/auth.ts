export default {
  signIn: {
    title: 'Se connecter à Wan a Dance',
    subtitle: 'Nous vous envoyons un code à 6 chiffres par e-mail. Aucun mot de passe.',
    emailLabel: 'E-mail',
    emailPlaceholder: 'vous@ecole.be',
    submit: 'Recevoir un code',
  },
  verify: {
    title: 'Vérifiez vos e-mails',
    subtitle: 'Saisissez le code à 6 chiffres envoyé à {email}.',
    codeLabel: 'Code à 6 chiffres',
    submit: 'Se connecter',
    resend: 'Envoyer un nouveau code',
    resendIn: 'Nouveau code dans {seconds} s',
    changeEmail: 'Utiliser une autre adresse',
  },
  errors: {
    invalidEmail: 'Saisissez une adresse e-mail valide.',
    invalidCode: 'Ce code est incorrect ou a expiré.',
    tooManyAttempts: 'Trop de tentatives. Demandez un nouveau code.',
    rateLimited: 'Trop de demandes. Réessayez dans une minute.',
  },
};
