import typescript from "@rollup/plugin-typescript";
// import dts from "rollup-plugin-dts";
import cleanup from "rollup-plugin-cleanup";
import { terser } from "rollup-plugin-terser";

import pkg from "./package.json";

const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
];

export default [{
    input: "index.ts",
    external,
    output: [
        {
            file: pkg.main,
            format: "umd",
            name: "promizr",
        },
        {
            file: pkg.browser,
            format: "umd",
            name: "promizr",
            plugins: [terser({format: { comments: false } })]
        },
    ],
    plugins: [
        typescript(),
        cleanup({ comments: "jsdoc", maxEmptyLines: 1 })
    ],
}, {
    input: "index.ts",
    external,
    external,
    output: [
        {
            file: pkg.module,
            format: "es",
        }
    ],
    plugins: [
        typescript({ target: "es6" }),
        cleanup({ comments: "jsdoc", maxEmptyLines: 1 })
    ]
}, /*{
    input: "index.ts",
    external,
    external,
    output: [
        {
            file: pkg.types,
            format: "es",
        }
    ],
    plugins: [
        dts(),
        cleanup({ comments: "jsdoc", maxEmptyLines: 1 })
    ]
}*/];
