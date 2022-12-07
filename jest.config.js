// Jestのカスタム設定を設置する場所。従来のプロパティはここで定義。
const customJestConfig = {
    // jest.setup.jsを作成する場合のみ定義。
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
        // aliasを定義 （tsconfig.jsonのcompilerOptions>pathsの定義に合わせる）
        "^@/components/(.*)$": "<rootDir>/components/$1",
        "^@/pages/(.*)$": "<rootDir>/pages/$1",
    },
    testEnvironment: "jest-environment-jsdom",
    roots: ["<rootDir>/tests/"],
};

module.exports = customJestConfig;