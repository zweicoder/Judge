import 'CheapArray.sol';
import 'JudgeSubscriber.sol';

// Contract to handle interactive verification sessions mainly for tedious repeated operations. Should only handle ongoing sessions
contract Judge {
    mapping(bytes32 => Challenge) challenges;
    mapping(bytes32 => Session) sessions;
    event Event_Challenge_Step(uint uuid, uint[9] indices); // This event is mainly to alert stakeholders to submit the indices requested
    event Event_Challenge_Ended(uint uuid, address liar);


    /*====================================================================
                        Custom structs and Modifiers
    ====================================================================*/
    struct Session {
        bool initialized;
        JudgeSubscriber subscriber; // Contract calling this
        address insurer; // Insurer
        address challenger; // Challenger
        uint threshold;
        uint started;
    }

    struct Challenge {
        bytes32 start;
        bytes32 end;
        bytes32 proposed;
        uint[9] indices; // hardcode branching factor for now
        using CheapArray for bytes32[] lbranches;
        using CheapArray for bytes32[] rbranches;
    }

    modifier onlySessionPlayers(bytes32 uuid) {
        Session session = sessions[uuid];
        if (msg.sender != session.insurer && msg.sender != session.challenger) throw;
        _
    }

    modifier onlyValidInput(bytes32 uuid,bytes32[] branches) {
        Challenge challenge = challenges[uuid];
        if (branches.length != 9 ) throw; // For now just throw if input is invalid. CheapArray needs some sort of constructor
        // Throw if input =/= consensus
        if (branches[0] != challenge.start) throw;
        if (branches[branches.length-1] != challenge.end && branches[branches.length-1] != challenge.proposed) throw;
        _
    }


    /*====================================================================
                        External / Public Functions
    ====================================================================*/
    // Called by others to initialize challenge
    function initChallenge(bytes32 uuid, JudgeSubscriber subscriber, address insurer, address challenger, bytes32 start, bytes32 end, bytes32 proposed, uint numOperations, uint threshold) external {
        // Not allowing ongoing sessions to be overwritten. Sessions are currenlty implemented to be 1v1, contracts will have to manage cases for multiple challengers
        // TODO implement uuid scheme somehow. Right now offload that job to users
        if (sessions[uuid].initialized) throw;

        // Initialize Challenge with predefined consensus
        challenges[uuid] = Challenge(start, end, proposed);
        sessions[uuid] = Session(true, subscriber, insurer, challenger, threshold, now);
        // Emit event to request for the result at each specified index
        Event_Challenge_Step(uuid, getBranchIndices(0, numOperations - 1));
    }

    // Method that players of the interactive verification game will call during an ongoing session
    function doChallenge(bytes32 uuid, bytes32[] branches) external onlyValidInput(uuid, branches) onlySessionPlayers(uuid) {
        
        if (!updateMoves(uuid)) return; // Wait for the other player. TODO check if time expired

        // Both have submitted the X number of branches
        var difference = findDifference(uuid);
        updateChallenge(uuid, difference);
    }


    /*====================================================================
                        Internal Functions
    ====================================================================*/
    // Update storage with a player's move (the branches). Returns true if both players have submitted their move.
    function updateMoves(bytes32 uuid, bytes32[] branches) internal returns(bool) {        
        Session session = sessions[uuid];
        Challenge challenge = challenges[uuid];

        if (msg.sender == session.insurer) {
            challenge.lbranches.insertAll(branches);
        } 
        else if (msg.sender == session.rightPlayer) {
            challenge.rbranches.insertAll(branches);
        }

        // TODO confirm that storage is modified via reference 
        return challenge.lbranches.n== 0 || challenge.rbranches.n == 0
    }

    // Find out who's correct if below threshold, else update state variables and request new indices
    function updateChallenge(bytes32 uuid, uint diffIdx) internal {
        Challenge challenge = challenges[uuid];
        Session session = sessions[uuid];
        var (start, end, proposed, indices, lbranches, rbranches) = challenge;
        var (newLeftIdx, newRightIdx) = indices[diffIdx-1], indices[diffIdx];
        var numOperations = newRightIdx - newLeftIdx;
        var (newStart, newEnd, newProposed) = (lbranches[diffIdx-1], lbranches[diffIdx], rbranches[diffIdx]);

        if (numOperations <= session.threshold) {
            var computed = repeatedlySha(newStart, newEnd, newProposed, numOperations);
            // The reason we take both ends is to prevent a dishonest person to win another dishonest person. ie challenger used a bad hash but the insurer was using a bad hash as well but now the challenger wins.
            var liar = getResult(computed, newEnd, newProposed);
            Event_Challenge_Ended(uuid, liar);
            session.subscriber.judgeCallback(uuid, liar);
            session.initialized = false; // Cheap clean up just in case. Maybe spend some gas to prevent bloat / pollution?
            return result;
        }

        // Update storage with new consensus
        challenge.start = newStart;
        challenge.end = newEnd;
        challenge.proposed = newProposed;
        challenge.lbranches.clear();
        challenge.rbranches.clear();
        challenge.indices = getBranchIndices(newLeftIdx, newRightIdx); // TODO use CheapArray

        // Request for new indices
        Event_Challenge_Step(uuid, challenge.indices);
    }


    /*====================================================================
                            Constant Helpers
    ====================================================================*/
    // Returns the indices for the next step in the verification. Branching factor hardcoded
    function getBranchIndices(left, right) constant internal returns (uint[9]) {
        var d = left + right;
        return [left, d/8, d/4, d*3/8, d/2, d*5/8, d*3/4, d*7/8, right];
    }

    // Here we find where things went wrong. Returns the index of the branch array where things first went wrong.
    function findDifference(bytes32 uuid) constant internal returns(uint8 diffIdx) {
        Challenge challenge = challenges[uuid];
        var indices = challenge.indices;

        for (uint i = 1; i < challenge.lbranches.length-1; i++) {
            if (challenge.lbranches[i] != challenge.rbranches[i]) {
                // We want to find the first place where the calculations diverged, then take the latest place where calculations are still agreed upon
                return i;
            }
        }

        // Variables not set cause nothing in the branches were different. Zoom to rightmost branch.
        // This will work as long as the threshold is bigger than branching factor
        return indices.length-1;
    }

    // we can abstract this to a function, and to do optional function args we take in contract address where contract has one method to call
    // Repeatedly sha start for n times and returns the result 
    function repeatedlySha(bytes32 start, bytes32 end, uint n) constant internal returns(bytes32) {
        var temp = start;
        for (uint i = 0; i < n; i++){
            temp = sha3(temp);
        }

        return temp;
    }

    // Determines the dishonest participant(s)
    function getResult(bytes32 computed, bytes32 end, bytes32 proposed) constant internal returns(address liar){
        if (computed != end && computed != proposed){ 
            return 0x0;
        }
        return computed != end ? insurer : challenger;
    }
}