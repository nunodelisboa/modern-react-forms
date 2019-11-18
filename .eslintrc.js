module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: ["standard"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: "module"
  },
  parser: "babel-eslint",
  plugins: ["react", "react-hooks"],
  rules: {
    semi: ["error", "always"],
    "template-curly-spacing": "off",
    indent: "off",
    "react/jsx-indent-props": [2, 2],
    "react/jsx-indent": [2, 2],
    "react/no-children-prop": "off",
    "react/jsx-key": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  settings: {
    react: {
      version: "16"
    }
  }
};
