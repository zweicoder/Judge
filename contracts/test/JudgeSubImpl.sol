import '../JudgeSubscriber.sol';

contract JudgeSubImpl is JudgeSubscriber {
    mapping(bytes32 => address) public result;
    
    function judgeCallback(bytes32 uuid, address liar) external {
        result[uuid] = liar;
    }
}