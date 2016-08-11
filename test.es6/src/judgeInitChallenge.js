import * as helpers from '../utils/testHelpers.js'

contract('Judge#initChallenge', (accounts) => {
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


  function initDefaultChallenge(judge, subscriber) {
    return helpers.setTime(now).then(() => {
      return judge.initChallenge(uuid, subscriber, insurer, challenger, start, end, proposed, numOperations, threshold)
    })
  }

  it('should properly initialize a challenge', () => {
    const {judge, subscriber} = getDeployed()
    const session = Object.assign({},
      initialSessionState, {
        subscriber
      })
    const event = judge.Event_Challenge_Step()
    const p1 = new Promise((resolve) => {
      event.watch((err, res) => {
        const {uuid: actualUuid, indices:actualIndices} = res.args
        assert.equal(actualUuid, uuid, 'Event should be emitted')
        assert.deepEqual(helpers.convertBigNumbers(actualIndices), initialChallengeState.indices, 'Indices should be requested')
        event.stopWatching()
        resolve()
      })
    })

    const p2 = initDefaultChallenge(judge, subscriber)
      .then(() => helpers.checkChallengeEquals(judge, uuid, initialChallengeState))
      .then(() => helpers.checkSessionEquals(judge, uuid, session))

    return Promise.all([p1, p2])
  })

  it('should disallow session overrides', () => {
    const {judge, subscriber} = getDeployed()
    const session = Object.assign({},
      initialSessionState, {
        subscriber
      })
    const badAddress = accounts[3]
    return judge.initChallenge(uuid, badAddress, badAddress, badAddress, end, start, start, 999999, 123)
      .then(() => {
      }, (err) => {
        assert.isOk(err)
      })
      .then(() => helpers.checkChallengeEquals(judge, uuid, initialChallengeState))
      .then(() => helpers.checkSessionEquals(judge, uuid, session))
  })
})

function getDeployed() {
  const judge = Judge.deployed()
  const subscriber = JudgeSubImpl.deployed().address
  return {
    judge,
    subscriber
  }
}