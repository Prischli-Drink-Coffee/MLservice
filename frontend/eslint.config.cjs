const eslintPluginReact = require("eslint-plugin-react");
const eslintPluginReactHooks = require("eslint-plugin-react-hooks");
const eslintPluginJsxA11y = require("eslint-plugin-jsx-a11y");
const eslintPluginImport = require("eslint-plugin-import");
const eslintPluginTestingLibrary = require("eslint-plugin-testing-library");
const eslintPluginJestDom = require("eslint-plugin-jest-dom");
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "build/**",
      "node_modules/**",
      // Ignore legacy Graph/Telegram code during migration (kept on disk but unused)
      "src/pages/GraphBuilderPage.jsx",
      "src/pages/GraphsPage.jsx",
      "src/pages/GraphDetailPage.jsx",
      "src/pages/NodeRegistryPage.jsx",
      "src/pages/TelegramPage.jsx",
      "src/components/graph/**",
      "src/components/graphs/**",
      "src/components/nodes/**",
      "src/components/edges/**",
      "src/components/telegram/**",
      "src/components/GraphNode.jsx",
    ],
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
      "jsx-a11y": eslintPluginJsxA11y,
      import: eslintPluginImport,
      "testing-library": eslintPluginTestingLibrary,
      "jest-dom": eslintPluginJestDom,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx"],
        },
      },
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "jsx-a11y/anchor-is-valid": "off",
      "import/no-unresolved": "off",
      "testing-library/no-unnecessary-act": "off",
    },
  },
];
