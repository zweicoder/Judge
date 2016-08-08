contract('CheapArrayLib', (accounts) => {
    const elems = ['1', '2', '3'].map((e) => web3.sha3(e))

    it('should start with an empty array', () => {
        const cheapArray = CheapArrayLibTest.deployed()
        return checkSizeEquals(cheapArray, 0)()
            .then(checkIsEmpty(cheapArray, true))
    })

    it('should insertAll elements', () => {
        const cheapArray = CheapArrayLibTest.deployed()
        return cheapArray.insertAll(elems)
            .then(() => {
                return Promise.all(
                    elems.map((e, idx) => {
                        return cheapArray.get.call(idx)
                            .then((res) => {
                                assert.equal(e, res)
                            })
                    })
                )
            })
    })

    it('should return the correct size', () => {
        const cheapArray = CheapArrayLibTest.deployed()
        return checkSizeEquals(cheapArray, elems.length, 'Size should update after inserting')()
            .then(checkIsEmpty(cheapArray, false, 'isEmpty should return false'))
    })

    it('should clear elements', () => {
        const cheapArray = CheapArrayLibTest.deployed()
        return cheapArray.clear()
            .then(checkSizeEquals(cheapArray, 0, 'Size should be 0 after clearing'))
            .then(checkIsEmpty(cheapArray, true, 'isEmpty should return true'))
    })

    it('should throw if idx for get(idx) is out of bounds', () => {
        const cheapArray = CheapArrayLibTest.deployed()
        return cheapArray.get(0)
            .then((r) => {
                assert.fail(0, 1)
            })
            .catch((e) => {
                assert.isOk(e)
            })
    })

    it('should still insert properly after clearing', () => {
        const cheapArray = CheapArrayLibTest.deployed()
        const anotherItem = web3.sha3('4')
        return cheapArray.insertAll(elems)
            .then(() => {
                return cheapArray.insert(anotherItem)
            })
            .then(checkSizeEquals(cheapArray, elems.length + 1))
            .then(checkIsEmpty(cheapArray, false))
            .then(() => {
                return Promise.all(
                    elems.concat(anotherItem).map((e, idx) => {
                        return cheapArray.get.call(idx)
                            .then((res) => {
                                assert.equal(e, res)
                            })
                    })
                )
            })
    })
})

function checkSizeEquals(arr, n, msg) {
    if (!msg) msg = ''
    return () => {
        return arr.getSize.call()
            .then((res) => {
                assert.equal(res.toNumber(), n, msg)
            })
    }
}

function checkIsEmpty(arr, bool, msg) {
    if (!msg) msg = ''
    return () => {
        return arr.isEmpty.call()
            .then((res) => {
                if (bool) {
                    assert.isOk(res, msg)
                    return
                }

                assert.isNotOk(res, msg)
            })
    }
}