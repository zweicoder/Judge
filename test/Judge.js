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

        return new Promise((resolve, reject) => {
            // Setup watcher
            event.watch((err, result) => {
                if (err) reject(err)

                const args = result.args
                assert.isNotOk(err)
                assert.equal(args.start, start)
                assert.equal(args.end, end)
                assert.equal(args.proposed, proposed)
                assert.deepEqual(args.indices.map((elem) => elem.toNumber()), Array(9).fill(0), 'Indices should be bytes32[9]')
 
                event.stopWatching()
                resolve()
            })

            judge.initChallenge(uuid, subscriber, insurer, challenger, start, end, proposed, numOperations, threshold)
        })
    })

    it('should disallow session overrides', () => {

    })
})