contract('CheapArrayLib', (accounts) => {
    const elems = ['1', '2', '3'].map((e) => web3.sha3(e))

    it('should start with an empty array', ()=>{
        const cheapArray = CheapArrayLibTest.deployed()
        return cheapArray.getSize.call()
            .then((res)=>{
                assert.equal(res, 0)
                return cheapArray.isEmpty.call()
            })
            .then((res)=>{
                assert.isOk(res ,'isEmpty should return true')
            })
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
        return cheapArray.getSize.call()
            .then((res)=>{
                assert.equal(res.toNumber(), elems.length, 'Size should update after inserting')
                return cheapArray.isEmpty.call()
            })
            .then((res)=>{
                assert.isNotOk(res ,'isEmpty should return false')
            })
    })

    it('should clear elements', () => {
        const cheapArray = CheapArrayLibTest.deployed()
        return cheapArray.clear()
            .then(() => {
                return cheapArray.getSize.call()
            })
            .then((res)=>{
                assert.equal(res, 0, 'Size should be 0 after clearing')
                return cheapArray.isEmpty.call()
            })
            .then((res)=>{
                assert.isOk(res ,'isEmpty should return true')
            })
    })

    it('should throw if idx for get(idx) is out of bounds', () =>{
        const cheapArray = CheapArrayLibTest.deployed()
        return cheapArray.get(0)
            .then((r)=>{
                assert.fail(0,1)
            })
            .catch((e)=>{
                assert.isOk(e)
            })
    })
})