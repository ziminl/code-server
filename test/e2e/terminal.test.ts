import { test, expect } from "@playwright/test"
import * as fs from "fs"
import { tmpdir } from "os"
import * as path from "path"
import util from "util"
import * as cp from "child_process"
import { STORAGE } from "../utils/constants"
import { CodeServer } from "./models/CodeServer"

test.describe("Integrated Terminal", () => {
  // Create a new context with the saved storage state
  // so we don't have to logged in
  const options: any = {}
  const testFileName = "pipe"
  const testString = "new string test from e2e test"
  let codeServer: CodeServer
  let tmpFolderPath: string = ""
  let tmpFile: string = ""

  // TODO@jsjoeio
  // Fix this once https://github.com/microsoft/playwright-test/issues/240
  // is fixed
  if (STORAGE) {
    const storageState = JSON.parse(STORAGE) || {}
    options.contextOptions = {
      storageState,
    }
  }
  test.beforeEach(async ({ page }) => {
    codeServer = new CodeServer(page)
    await codeServer.setup()
    // NOTE@jsjoeio
    // We're not using tmpdir from src/node/constants
    // because Playwright doesn't fully support ES modules from
    // the erorrs I'm seeing
    tmpFolderPath = fs.mkdtempSync(path.join(tmpdir(), "code-server-test"))
    tmpFile = path.join(tmpFolderPath, testFileName)
  })

  test.afterEach(async () => {
    // Ensure directory was removed
    fs.rmdirSync(tmpFolderPath, { recursive: true })
  })

  test("should echo a string to a file", options, async ({ page }) => {
    const command = `mkfifo '${tmpFile}' && cat '${tmpFile}'`
    const exec = util.promisify(cp.exec)
    const output = exec(command, { encoding: "utf8" })

    // Open terminal and type in value
    await codeServer.focusTerminal()

    await page.waitForLoadState("load")
    await page.keyboard.type(`echo '${testString}' > '${tmpFile}'`)
    await page.keyboard.press("Enter")

    const { stdout } = await output
    expect(stdout).toMatch(testString)

    // .access checks if the file exists without opening it
    // it doesn't return anything hence why we expect it to
    // resolve to undefined
    // If the promise rejects (i.e. the file doesn't exist)
    // then the assertion will fail
    await expect(fs.promises.access(tmpFile)).resolves.toBeUndefined()

    await fs.promises.rmdir(tmpFolderPath, { recursive: true })
    // Make sure neither file nor folder exist
    // Note: We have to use ts-ignore because of an upstream typing error
    // See: https://github.com/microsoft/folio/issues/230#event-4621948411
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    expect(fs.promises.access(tmpFile)).rejects.toThrowError(/no such file or directory/)
    // @ts-ignore
    expect(fs.promises.access(tmpFolderPath)).rejects.toThrowError(/no such file or directory/)
  })
})
