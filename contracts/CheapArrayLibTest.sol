import 'CheapArrayLib.sol';

contract CheapArrayLibTest {
    using CheapArrayLib for CheapArrayLib.Array;
    CheapArrayLib.Array public arr;

    function CheapArrayLibTest() {}

    function insertAll(bytes32[] values) {
        arr.insertAll(values);
    }

    function insert(bytes32 value) {
        arr.insert(value);
    }


    function get(uint i) constant returns (bytes32) {
        return arr.get(i);
    }

    function clear() {
        arr.clear();
    }

    function getSize() constant returns (uint) {
        return arr.getSize();
    }

    function isEmpty() constant returns (bool) {
        return arr.isEmpty();
    }
}