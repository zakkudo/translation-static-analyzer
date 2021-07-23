#!/usr/bin/env node

import childProcess from "child_process";
import path from "path";
import fs from "fs";

const changedFiles = String(
  childProcess.execSync("git diff --cached --name-only --diff-filter=ACMR")
)
  .split("\n")
  .filter((f) => fs.existsSync(f));
const ESLINT = "./node_modules/.bin/eslint";
const PRETTIER = "./node_modules/.bin/prettier";
const INTERNAL_ERROR = 2;

function stageChanges(files) {
  childProcess.execSync(
    `git add ${files.map((f) => JSON.stringify(f)).join(" ")}`
  );
}

function format(commandName, command, files) {
  try {
    const fullCommand = `${command} ${files
      .map((f) => JSON.stringify(f))
      .join(" ")}`;
    console.log(`Formatting ${files.length} file(s) with ${commandName}...`);
    console.log(fullCommand);
    console.log("");
    childProcess.execSync(fullCommand, { stdio: "inherit" });
    console.log("");
    stageChanges(files);
  } catch (e) {
    // https://eslint.org/docs/user-guide/command-line-interface#exit-codes
    if (e.status === INTERNAL_ERROR) {
      console.log("");
      console.log(
        `There seems to be a problem with ${commandName}.  Please fix it before continuing. (It may be related to the configuration.)`
      );
      console.log("");
    } else {
      console.log(e.message);
    }

    throw e;
  }
}

function formatWithEslint() {
  const extnames = new Set(
    ["js", "jsx", "ts", "tsx", "json"].map((e) => `.${e}`)
  );
  const files = changedFiles.filter((f) => extnames.has(path.extname(f)));
  if (files.length) {
    format("eslint", `${ESLINT} --fix`, files);
  }
}

function formatWithPrettier() {
  const extnames = new Set(
    ["js", "jsx", "ts", "tsx", "json", "sh", "md", "mjs"].map((e) => `.${e}`)
  );
  const files = changedFiles.filter((f) => extnames.has(path.extname(f)));
  if (files.length) {
    format("prettier", `${PRETTIER} --ignore-unknown --write`, files);
  }
}

formatWithEslint();
formatWithPrettier();
