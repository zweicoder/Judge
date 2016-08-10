export function checkSessionEquals(judge, uuid, session) {
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

export function checkChallengeEquals(judge, uuid, challenge) {
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

export function shouldFail(p, message) {
  return p.then(() => {
              assert.fail(0, 1, message)
            }, (err) => {
              assert.isOk(err, message)
            })
}

// Monkey patch testrpc time
export function setTime(newTime) {
  Date.prototype.getTime = function() {
    return newTime;
  }
}

export function rpc(method, arg) {
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

export function getIndices(left, right) {
  const d = left + right;
  return [left, d / 8, d / 4, d * 3 / 8, d / 2, d * 5 / 8, d * 3 / 4, d * 7 / 8, right];
}

export function convertBigNumbers(arr) {
  return arr.map((elem) => elem.toNumber())
}