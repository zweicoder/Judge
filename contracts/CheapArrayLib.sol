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

    function get(Array storage self, uint i) constant internal returns(bytes32){
        if (i >= getSize(self)){
            throw;
        }
        return self.elems[i];
    }

    function getAll(Array storage self) constant internal returns(bytes32[]) {
        bytes32[] memory ret = new bytes32[](getSize(self));
        for (uint i = 0; i < getSize(self); i++) {
            ret[i] = self.elems[i];
        }
        return ret;
    }

    function clear(Array storage self) internal {
        self.active = 0;
    }

    function isEmpty(Array storage self) constant internal returns(bool) {
        return getSize(self) ==0;
    }

    function getSize(Array storage self) constant internal returns(uint) {
        return self.active;
    }
}