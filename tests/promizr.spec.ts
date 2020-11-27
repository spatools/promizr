import * as path from "path";
import { promises as fs } from "fs";

import * as promizr from "../index";

const LIB_DIR = path.join(__dirname, "..", "lib");

describe("promizr", () => {
    let MODULES: string[];

    beforeAll(async () => {
        const files = await fs.readdir(LIB_DIR);
        MODULES = files.filter(f => !f.startsWith("_"));
    });

    test("should export all modules in lib", async () => {
        for (const moduleFile of MODULES) {
            const key = path.basename(moduleFile, ".ts") as keyof typeof promizr;
            expect(promizr).toHaveProperty(key);
        }
    });

    test("should have a test for each module", async () => {
        for (const moduleFile of MODULES) {
            const key = path.basename(moduleFile, ".ts");
            const stat = await fs.stat(path.join(__dirname, `${key}.spec.ts`));
            expect(stat.isFile()).toBe(true);
        }
    });

});
