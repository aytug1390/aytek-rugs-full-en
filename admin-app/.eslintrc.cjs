module.exports = {
  root: true,
  env: { browser: true, node: true, es2021: true },
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
  rules: {
    // Block hard-coded Drive/LH3 hostnames in client-side files in admin-app
    'no-restricted-syntax': [
      'error',
      {
        selector: "Literal[value=/lh3\.googleusercontent\.com|drive\.google\.com|drive\.usercontent\.googleapis\.com|drive\.googleusercontent\.com/ ]",
        message: 'Hard-coded Google Drive/LH3 hostnames are restricted. Use ProxyImg/getDriveImageSrc to proxy images via /api/drive.'
      }
    ]
  }
};
