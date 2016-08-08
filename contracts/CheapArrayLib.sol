// http://ethereum.stackexchange.com/questions/3373/how-to-clear-large-arrays-without-blowing-the-gas-limit
library CheapArrayLib {
    struct Array {
        bytes32[] elems;
        uint active;
    }

    function insertAll(Array storage self, bytes32[] values) internal {
        for (uint i=0; i < values.length; i++) {
            insert(self, values[i]);
        }
    }

    function insert(Array storage self, bytes32 value) internal {
        if(self.active == self.elems.length) {
            self.active = self.elems.push(value);
            return;
        }
        self.elems[self.active++] = value;
    }

    function get(Array storage self, uint i) constant returns(bytes32){
        if (i >= getSize(self)){
            throw;
        }
        return self.elems[i];
    }

    function clear(Array storage self) internal {
        self.active = 0;
    }

    function isEmpty(Array storage self) constant returns(bool) {
        return getSize(self) ==0;
    }

    function getSize(Array storage self) constant returns(uint) {
        return self.active;
    }
}