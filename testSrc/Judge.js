contract('Judge', (accounts) => {
  const uuid = web3.sha3('sessionId')
  const insurer = accounts[0],
    challenger = accounts[1],
    start = web3.sha3('test'),
    end = '0xbca242572c2516eaac84033698f0c015b8b882d0d214c65ce57281df1dcf27e7',
    proposed = '0xbca242572c2516eaac84033698f0c015b8b882d0d214c65ce57281df1dc11111',
    numOperations = 1000,
    threshold = 10;
  const initialChallengeState = {
    start,
    end,
    proposed,
    indices: Array(9).fill(0),
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
    return judge.initChallenge(uuid, subscriber, insurer, challenger, start, end, proposed, numOperations, threshold)
      .then(checkChallengeEquals(judge, uuid,
        initialChallengeState))
      .then(checkSessionEquals(judge, uuid, session))

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