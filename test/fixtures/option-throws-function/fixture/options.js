module.exports = {
  "throws": (error) => error instanceof SyntaxError && /captured/.test(error.message)
}
