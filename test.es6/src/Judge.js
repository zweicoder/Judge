import * as helpers from '../utils/testHelpers.js'

contract('Judge', (accounts) => {
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
    return judge.initChallenge(uuid, subscriber, insurer, challenger, start, end, proposed, numOperations, threshold)
  }

  contract('#initChallenge', () => {
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
        .then(helpers.checkChallengeEquals(judge, uuid, initialChallengeState))
        .then(helpers.checkSessionEquals(judge, uuid, session))

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
        .then(helpers.checkChallengeEquals(judge, uuid, initialChallengeState))
        .then(helpers.checkSessionEquals(judge, uuid, session))
    })
  })


  contract('#doChallenge', (accounts) => {
    it('should not accept invalid inputs', () => {
      const {judge, subscriber} = getDeployed()
      return judge.initChallenge(uuid, subscriber, insurer, challenger, start, end, proposed, numOperations, threshold, {
        from: challenger
      })
        .then(() => {
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
    })

    it('should only work for valid sessions', () => {
      const {judge, subscriber} = getDeployed()
      const badUuid = web3.sha3('someOtherUuid')
      const validInput = [start, ...Array(7).fill(0), end]
      return helpers.shouldFail(judge.doChallenge(badUuid, validInput))
    })

    it('should wait for the both players', () => {
      const {judge, subscriber} = getDeployed()
      const validInput = [start, ...Array(7).fill(0), end]
      return judge.doChallenge(uuid, validInput, {
        from: insurer
      })
        .then(() => {
          // Challenge state should still be updated
          const expectedChallenge = Object.assign({}, initialChallengeState, {
            lbranches: validInput
          })
          return helpers.checkChallengeEquals(judge, uuid, expectedChallenge)
        })
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
})

function getDeployed() {
  const judge = Judge.deployed()
  const subscriber = JudgeSubImpl.deployed().address
  return {
    judge,
    subscriber
  }
}