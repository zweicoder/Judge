import * as helpers from '../utils/testHelpers.js'

contract('Judge#doChallenge', (accounts) => {
  const uuid = web3.sha3('sessionId')
  const insurer = accounts[0],
    challenger = accounts[1],
    start = web3.sha3('test'),
    end = '0xbca242572c2516eaac84033698f0c015b8b882d0d214c65ce57281df1dcf27e7',
    proposed = '0x4815df9e96c597ee2a467ce5c7f4f99609227d02406a887860f0e8b74627c1e4',
    numOperations = 1001,
    threshold = 10;
  const initialChallengeState = {
    start,
    end,
    proposed,
    indices: helpers.getIndices(0, numOperations - 1),
    lbranches: [],
    rbranches: []
  }
  const now = 12345
  helpers.setTime(now)
  const initialSessionState = {
    insurer,
    challenger,
    threshold,
    initialized: true,
    lastActive: now
  }

  let snapshotId;
  // Hack to setup and save a snapshot
  it('should setup', () => {
    const {judge, subscriber} = getDeployed()
    initialSessionState.subscriber = subscriber
    return judge.initChallenge(uuid, subscriber, insurer, challenger, start, end, proposed, numOperations, threshold, {
      from: challenger
    })
      .then(() => {
        return helpers.saveSnapshot()
      })
      .then((res) => {
        snapshotId = res.result
      })
  })

  it('should not accept invalid inputs', () => {
    const {judge, subscriber} = getDeployed()
    const p1 = helpers.shouldFail(
      judge.doChallenge(uuid, [start, ...Array(7).fill(0), start]),
      'Inputs that do not respect the consensus are not accepted'
    )
    const p2 = helpers.shouldFail(
      judge.doChallenge(uuid, [end, ...Array(7).fill(0), end]),
      'Inputs that do not respect the consensus are not accepted'
    )
    const p3 = helpers.shouldFail(
      judge.doChallenge(uuid, [end, ...Array(7).fill(0), start]),
      'Inputs that do not respect the consensus are not accepted'
    )
    const p4 = helpers.shouldFail(
      judge.doChallenge(uuid, [start, ...Array(2).fill(0), end]),
      'Inputs with the wrong length (not 9) are not accepted'
    )
    return Promise.all([p1, p2, p3, p4])
  })

  it('should only work for valid sessions', () => {
    const {judge, subscriber} = getDeployed()
    const badUuid = web3.sha3('someOtherUuid')
    const validInput = [start, ...Array(7).fill(0), end]
    return helpers.shouldFail(judge.doChallenge(badUuid, validInput))
  })

  it('should wait for the challenger', () => {
    const {judge, subscriber} = getDeployed()
    const validInput = [start, ...Array(7).fill('0x0000000000000000000000000000000000000000000000000000000000000000'), end]
    return helpers.setTime(now + 1)
      .then(() => {
        return judge.doChallenge(uuid, validInput, {
          from: insurer
        })
      })
      .then(() => {
        // Challenge state should still be updated
        const expectedChallenge = Object.assign({}, initialChallengeState, {
          lbranches: validInput
        })
        return helpers.checkChallengeEquals(judge, uuid, expectedChallenge)
      })
      .then(() => helpers.checkSessionEquals(judge, uuid, initialSessionState)
    )
  })

  it('should revert to snapshot', () => {
    const {judge, subscriber} = getDeployed()
    return helpers.revertToSnapshot(snapshotId)
      .then((res) => helpers.checkChallengeEquals(judge, uuid, initialChallengeState)
    )
  })

  it('should wait for the insurer', () => {
    const {judge, subscriber} = getDeployed()
    const validInput = [start, ...Array(7).fill('0x0000000000000000000000000000000000000000000000000000000000000000'), end]
    helpers.setTime(now + 1)
    return helpers.revertToSnapshot(snapshotId)
      .then(() => {
        return judge.doChallenge(uuid, validInput, {
          from: challenger
        })
      })
      .then(() => {
        // Challenge state should still be updated
        const expectedChallenge = Object.assign({}, initialChallengeState, {
          rbranches: validInput
        })
        return helpers.checkChallengeEquals(judge, uuid, expectedChallenge)
      })
      .then(() => helpers.checkSessionEquals(judge, uuid, initialSessionState))
  })

  it('should only proceed with both player moves')

  // it('adsasd', () => {
  //   const {judge, subscriber} = getDeployed()
  //   const validInput = [start, ...Array(7).fill(0), end]
  //   const event = judge.Log()
  //   event.watch((err, res) => {
  //     console.log(res.args)
  //   })
  //   return judge.test(uuid, validInput)
  // })

  it('should stop accepting inputs after timeout')

})

function getDeployed() {
  const judge = Judge.deployed()
  const subscriber = JudgeSubImpl.deployed().address
  return {
    judge,
    subscriber
  }
}