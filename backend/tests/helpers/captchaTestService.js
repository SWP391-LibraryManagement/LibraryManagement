function createAcceptingCaptchaService() {
  return {
    createChallenge() {
      return {
        image: 'data:image/svg+xml;base64,PHN2Zy8+',
        captchaToken: 'test-captcha-token',
        expiresIn: 300,
      };
    },
    verifyChallenge() {
      return true;
    },
  };
}

module.exports = { createAcceptingCaptchaService };
