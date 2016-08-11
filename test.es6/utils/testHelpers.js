import axios from 'axios'

export function checkSessionEquals(judge, uuid, session) {
  const {initialized, subscriber, insurer, challenger, threshold, lastActive} = session
  return judge.getSession.call(uuid)
    .then((res) => {
      const [actualInitialized, actualSubscriber, actualInsurer, actualChallenger, actualThreshold, actualLastActive] = res
      const actualSession = {
        initialized: actualInitialized,
        subscriber: actualSubscriber,
        insurer: actualInsurer,
        challenger: actualChallenger,
        threshold: actualThreshold.toNumber(),
        lastActive: actualLastActive.toNumber()
      }

      assert.deepEqual(actualSession, session)
    })
}

export function checkChallengeEquals(judge, uuid, challenge) {
  const {start, end, proposed, indices, lbranches, rbranches} = challenge
  return judge.getChallenge.call(uuid)
    .then((res) => {
      const [actualStart, actualEnd, actualProposed, actualIndices, actualLbranches, actualRbranches] = res
      const actualChallenge = {
        start: actualStart,
        end: actualEnd,
        proposed: actualProposed,
        indices: actualIndices.map((elem) => elem.toNumber()),
        lbranches: actualLbranches,
        rbranches: actualRbranches
      }
      assert.deepEqual(actualChallenge, challenge)
    })
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
  const baseURL = 'http://localhost:8546'
  return axios.post(baseURL, {
    time: newTime
  })
}

export function saveSnapshot() {
  return rpc('evm_snapshot')
}

export function revertToSnapshot() {
  return rpc('evm_revert')
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