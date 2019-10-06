module.exports = {
    "root": true,
    "env": {
        "browser": false,
        "es6": true,
    },
    "parser": "babel-eslint",
    "extends": [
        "plugin:prettier/recommended",
        "eslint:recommended",
    ],
    "parserOptions": {
        "ecmaVersion": 6,
    },
    "plugins": [
        "prettier",
        "import",
    ],
    "rules": {
        "strict": 0,
        "no-useless-escape": "off",
        "no-mixed-spaces-and-tabs": "error",
        "keyword-spacing": ["error"],
        "linebreak-style": ["error", "unix"],
        "no-console": ["error", {"allow": ["warn", "error"]}],
        "prettier/prettier": "error",
        "no-undef": "off",
    }
};
