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

  it('should properly initialize a challenge', () => {
    const {judge, subscriber} = getDeployed()
    //TODO check other events
    return judge.initChallenge(uuid, subscriber, insurer, challenger, start, end, proposed, numOperations, threshold)
      .then(checkChallengeEquals(judge, uuid,
        initialChallengeState))
  })

  it('should disallow session overrides', () => {
    const {judge, subscriber} = getDeployed()
    //TODO check other events
    const badAddress = accounts[3]
    return judge.initChallenge(uuid, badAddress, badAddress, badAddress, end, start, start, 999999, 123)
      .then(checkChallengeEquals(judge, uuid, initialChallengeState))
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