include "../node_modules/circomlib/circuits/comparators.circom";

// given a 2d array, prove that one knows the sum of the array
template arraySum() {
    // public inputs
    signal input publicGuess[5];
    signal input differences;

    // private inputs
    signal private input privateSolution[5];

    // output
    signal output out;

    // intermediary signals
    // signal totalDiffs;
    
    var diffs = 0;
    
    for(var i=0; i<5; i++){
        if(publicGuess[i] == privateSolution[i]){
            diffs += 1;
        }
    }

    // create a constraint around the number of differences
    diffs * diffs === diffs * differences;
    
    // totalDiffs <== diffs;

    out === 1;

    // component eq = IsEqual();
    // eq.in[0] <== totalDiffs;
    // eq.in[1] <== differences;
    // eq.out === 1;

    // out <-- eq.out;
    // out === 1;
}

component main = arraySum();