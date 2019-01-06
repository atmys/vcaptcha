module.exports = (language, names) => {

  const phrases = {
    en: `If you are a human, select ${names[0]}, then ${names[1]}.`,
    fr: `Si vous êtes humain, sélectionnez ${names[0]}, puis ${names[1]}.`
  }

  return phrases[language];
}