include "../node_modules/circomlib/circuits/gates.circom"
include "../node_modules/circomlib/circuits/comparators.circom";

// given a 2d array, prove that one knows the number of same elements between two 2d arrays. 
template arraySum(ARR_SIZE) {
    // public inputs
    signal input publicGuess[ARR_SIZE][ARR_SIZE];
    signal input similarities;

    // private inputs
    signal private input privateSolution[ARR_SIZE][ARR_SIZE];

    // output
    signal output out;

    // components
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

    component sumEq = IsEqual();
    sumEq.in[0] <== eqSum;
    sumEq.in[1] <== similarities;
    sumEq.out === 1;

    out <-- sumEq.out;
    out === 1;
}

component main = arraySum(5);