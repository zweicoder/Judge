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
    indices: getIndices(0, numOperations - 1),
    lbranches: [],
    rbranches: []
  }
  const now = 123445678
  setTime(now)
  const initialSessionState = {
    insurer,
    challenger,
    threshold,
    initialized: true,
    lastActive: now
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
        assert.deepEqual(convertBigNumbers(actualIndices), initialChallengeState.indices, 'Indices should be requested')
        event.stopWatching()
        resolve()
      })
    })

    const p2 = judge.initChallenge(uuid, subscriber, insurer, challenger, start, end, proposed, numOperations, threshold)
      .then(checkChallengeEquals(judge, uuid, initialChallengeState))
      .then(checkSessionEquals(judge, uuid, session))

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
      .catch((e) => {
        assert.isOk(e, 'It should throw an invalid JUMP error')
      })
      .then(checkChallengeEquals(judge, uuid, initialChallengeState))
      .then(checkSessionEquals(judge, uuid, session))
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

function checkSessionEquals(judge, uuid, session) {
  const {initialized, subscriber, insurer, challenger, threshold, lastActive} = session
  return () => {
    return judge.getSession.call(uuid)
      .then((res) => {
        const [actualInitialized, actualSubscriber, actualInsurer, actualChallenger, actualThreshold, actualLastActive] = res
        assert.equal(actualInitialized, initialized)
        assert.equal(actualSubscriber, subscriber)
        assert.equal(actualInsurer, insurer)
        assert.equal(actualChallenger, challenger)
        assert.equal(actualThreshold, threshold)
      // KIV find good way to check and manipulate time
      // assert.equal(actualLastActive.toNumber(), lastActive)
      })
  }
}

function checkChallengeEquals(judge, uuid, challenge) {
  const {start, end, proposed, indices, lbranches, rbranches} = challenge
  return () => {
    return judge.getChallenge.call(uuid)
      .then((res) => {
        const [actualStart, actualEnd, actualProposed, actualIndices, actualLbranches, actualRbranches] = res
        assert.equal(actualStart, start)
        assert.equal(actualEnd, end)
        assert.equal(actualProposed, proposed)
        assert.deepEqual(actualIndices.map((elem) => elem.toNumber()), indices)
        assert.deepEqual(actualLbranches, lbranches)
        assert.deepEqual(actualRbranches, rbranches)
      })
  }
}

// Monkey patch testrpc time
function setTime(newTime) {
  Date.prototype.getTime = function() {
    return newTime;
  }
}

function rpc(method, arg) {
  var req = {
    jsonrpc: "2.0",
    method: method,
    id: new Date().getTime()
  };
  if (arg)
    req.params = arg;

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(req, (err, result) => {
      if (err) return reject(err)
      if (result && result.error) {
        return reject(new Error("RPC Error: " + (result.error.message || result.error)))
      }
      resolve(result)
    })
  })
}

function getIndices(left, right) {
  const d = left + right;
  return [left, d / 8, d / 4, d * 3 / 8, d / 2, d * 5 / 8, d * 3 / 4, d * 7 / 8, right];
}

function convertBigNumbers(arr) {
  return arr.map((elem) => elem.toNumber())
}