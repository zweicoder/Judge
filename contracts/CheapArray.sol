// http://ethereum.stackexchange.com/questions/3373/how-to-clear-large-arrays-without-blowing-the-gas-limit
library CheapArray {
    struct Data {
        bytes[] elems;
        uint n;
    }

    function insertAll(Data storage self, bytes[] values) internal {
        for (uint i=0; i < values.length; i++) {
            insert(self, values[i]);
        }
    }

    function insert(Data storage self, bytes value) internal {
        if(self.n == self.elems.length) {
            self.n = self.elems.push(value);
            return;
        }
        self.elems[self.n] = value;
    }

    function clear(Data storage self) internal {
        self.n = 0;
    }

    function isEmpty(Data storage self) constant returns(bool) {
        return self.n ==0;
    }
}