import { OperatorCmdHistory } from '../../state/operator-cmd-history.mjs'

export class CmdManager {
  #cmdHistory
  #logger

  constructor (opts) {
    if (!opts) throw new Error('opts must be provided!')
    if (!opts.cmdHistory) throw new Error('opts.cmdHistory must be provided!')
    if (!(opts.cmdHistory instanceof OperatorCmdHistory)) throw new Error('opts.cmdHistory must be an instance of OperatorCmdHistory')
    this.#cmdHistory = opts.cmdHistory
    this.#logger = opts.logger
  }

  async ensureCommandsHaveBeenProcessed (cmds) {
    for (const cmd of cmds) {
      await this.runCmdOnce(cmd)
    }
  }

  async runCmdOnce (cmd) {
    if (await this.#hasCmdAlreadyBeenRun(cmd)) {
      this.#logger?.log('cmd has already been run, ignoring')
      return true
    }
    try {
      await this.#executeCommand(cmd)
      await this.#cmdHistory.recordSuccessfulCommand(cmd)
      return true
    } catch (err) {
      await this.#cmdHistory.recordFailedCommand(cmd, err)
      return false
    }
  }

  async #executeCommand (cmd) {

  }

  async #hasCmdAlreadyBeenRun (cmd) {
    const runs = await this.#cmdHistory.getSuccessfullRuns(cmd)
    return runs == null || runs.length === 0
  }
}
