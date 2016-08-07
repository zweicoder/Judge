// http://ethereum.stackexchange.com/questions/3373/how-to-clear-large-arrays-without-blowing-the-gas-limit
library CheapArrayLib {
    struct Array {
        bytes32[] elems;
        uint n;
    }

    function insertAll(Array storage self, bytes32[] values) internal {
        for (uint i=0; i < values.length; i++) {
            insert(self, values[i]);
        }
    }

    function insert(Array storage self, bytes32 value) internal {
        if(self.n == self.elems.length) {
            self.n = self.elems.push(value);
            return;
        }
        self.elems[self.n] = value;
    }

    function get(Array storage self, uint i) constant returns(bytes32){
        return self.elems[i];
    }

    function clear(Array storage self) internal {
        self.n = 0;
    }

    function isEmpty(Array storage self) constant returns(bool) {
        return self.n ==0;
    }

    function getSize(Array storage self) constant returns(uint) {
        return self.elems.length;
    }
}