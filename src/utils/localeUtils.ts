import * as i18n from 'i18n';

const supportLanguage = ['en'];

/**
 * Get locale message. To use `annotationValue`, take a look the following guide:
 * For instance, there is a locale string like: "Hello Dog! I'm Cat", let think about reuse the locale string.
 * To make the string be reusable, we need to know which words are static and dynamic:
 *
 * ----->   Hello Dog! I'm Cat
 *          ----- ---  --- ---
 *            |    |    |   |
 *            |    |    |   |
 *            1    2    1   2
 *
 * In this case, words marked with 1 are static, and 2 are dynamic. We will add the annotation to replace the dynamic as follows:
 *
 * ----->   Helle %s! I'm %s
 *
 * The annotation is %s.
 * The value to replace with annotation will be passed by an array as follows:
 *
 * `localeMessage('en', "Hello %firstname! I'm %lastname", ['Dog', 'Cat'])`
 *
 * The other way is {{property_name}} called named value: For instance: Hello {{firstname}}! I'm {{lastname}}.
 * The value with this is `localeMessage('en', "Hello %firstname! I'm %lastname", null, {firstname: 'Dog', lastname: 'Cat'})`
 *
 * The above one is just a demonstration code. The usage is based on code implementation.
 *
 * @param {string} lang
 * @param {string} phrase
 * @param {*} annotationValue Only affect to phrase supporting formatting
 * @param {object} nameValued
 * @returns {string}
 */
const localeMessage = function (lang: string, phrase: string, annotationValue?: any, nameValued?: any): string {
  if (supportLanguage.indexOf(lang) < 0) {
    lang = 'en';
  }

  return i18n.__(
    {
      phrase,
      locale: lang,
    },
    annotationValue,
    nameValued,
  );
};

export const validateMessage = function (
  lang: string,
  message: string,
  annotationValue?: any,
  nameValued?: any,
): string {
  return localeMessage(lang, 'VALIDATE.' + message, annotationValue, nameValued);
};

export const commonMessage = function (lang: string, message: string, annotationValue?: any, nameValued?: any): string {
  return localeMessage(lang, 'COMMON.' + message, annotationValue, nameValued);
};

export const orderMessage = function (lang: string, message: string): string {
  return localeMessage(lang, 'ORDER.' + message);
};
