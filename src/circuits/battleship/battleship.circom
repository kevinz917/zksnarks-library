include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom"
include "../node_modules/circomlib/circuits/mimcsponge.circom"

template MapHash(n) {
    signal input ins[n];
    signal output out;

    component msg_hasher = MiMCSponge(n, 220, 1);
    for (var i=0; i<n; i++) {
        msg_hasher.ins[i] <== ins[i];
    }
    msg_hasher.k <== 0;

    out <== msg_hasher.outs[0];
}

// given a 2d array, prove that one knows the number of same elements between two 2d arrays. 
template arraySum(ARR_SIZE, TOTAL_SHIP_UNIT_NUM) {

    signal input publicGuess[ARR_SIZE][ARR_SIZE];    // map of guess with 1 grid colored in as guess
    signal input hit;                                // verifier's response on whether this location was hit. 1 is true, 0 is false.

    signal private input privateSolution[ARR_SIZE][ARR_SIZE];

    signal output out;

    component eqs[ARR_SIZE][ARR_SIZE];
    var eqMap[ARR_SIZE][ARR_SIZE];
    
    for(var i=0; i<ARR_SIZE; i++){
        for(var j=0; j<ARR_SIZE; j++){
            eqs[i][j] = IsEqual()
            eqs[i][j].in[0] <== publicGuess[i][j];
            eqs[i][j].in[1] <== privateSolution[i][j];
            eqMap[i][j] = eqs[i][j].out;
        }
    }

    var eqSum = 0;

    for(var i=0; i<ARR_SIZE; i++) {
        for(var j=0; j<ARR_SIZE; j++){
            eqSum += eqMap[i][j]
        }
    }

    // calculate whether region was hit 
    component sumEq = IsEqual();
    sumEq.in[0] <== eqSum;
    sumEq.in[1] <== ARR_SIZE*ARR_SIZE-TOTAL_SHIP_UNIT_NUM+1;

    // compares whether region was hit with what verifier said 
    component is_guess_correct = AND();
    is_guess_correct.a <== sumEq.out;
    is_guess_correct.b <== hit;

    is_guess_correct.out === 1;

    // verify that the hash of your private map matches pubMapHash
    // to make sure one didn't tamper with their map between rounds
    // TODO: Downloaod bigger power of TAU to accomodate for bigger board sizes
    component mimc = MiMCSponge(ARR_SIZE*ARR_SIZE, 220, 1);

    var counter = 0;
    for(var i=0; i<ARR_SIZE; i++) {
        for(var j=0; j<ARR_SIZE; j++){
            mimc.ins[counter] <== privateSolution[i][j];
            counter += 1;
        }
    }

    mimc.k <== 0;

    out <== mimc.outs[0];
}

component main = arraySum(2, 3);