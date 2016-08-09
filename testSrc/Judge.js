contract('Judge', (accounts) => {
    const uuid = web3.sha3('sessionId')
    const insurer = accounts[0],
        challenger = accounts[1],
        start = web3.sha3('test'),
        end = '0xbca242572c2516eaac84033698f0c015b8b882d0d214c65ce57281df1dcf27e7',
        proposed = '0xbca242572c2516eaac84033698f0c015b8b882d0d214c65ce57281df1dc11111',
        numOperations = 1000,
        threshold = 10

    it('should properly initialize a challenge', () => {
        const judge = Judge.deployed()
        const subscriber = JudgeSubImpl.deployed().address
        const event = judge.Log_Challenge()
            //TODO check other events
        return judge.initChallenge(uuid, subscriber, insurer, challenger, start, end, proposed, numOperations, threshold)
            .then(() => {
                return judge.getChallenge.call(uuid)
            })
            .then((res) => {
                const [actualStart, actualEnd, actualProposed, actualIndices, actualLbranches, actualRbranches] = res
                assert.equal(actualStart, end)
                assert.equal(actualEnd, end)
                assert.equal(actualProposed, proposed)
                assert.deepEqual(actualIndices.map((elem) => elem.toNumber()), Array(9).fill(0), 'Indices should be bytes32[9]')
                assert.deepEqual(actualLbranches, [])
                assert.deepEqual(actualRbranches, [])
            })
    })

    it('should disallow session overrides', () => {

    })
})