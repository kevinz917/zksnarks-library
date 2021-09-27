include "../../node_modules/circomlib/circuits/comparators.circom";

// searches whether a grid can be traversed from point A to point B
// applications: prove that a player has traversed from point 1 to point b without revealing location
// TODO: Copy code from main.circom to here
// TODO: Figure out better compilation workflow

template BFS() {
    signal input map[4][4]; // 4 by 4 grid. 1 denotes obstacle, 0 denotes traversable path
    // signal private input start[2]; // (x, y) of start location
    // signal private input end[2];  // (x, y) of end location
    signal private input numberOfObstacles;

    signal output out; // 0 or 1

    var obstacles = 0;
    for(var i=0; i<4; i++){
        for(var j=0; j<4; j++){
            if(map[i][j] == 1){
                obstacles++;
            }
        }
    }

    component validity = IsEqual(); // instantiate an imported template
    validity.in[0] <== obstacles;
    validity.in[1] <== numberOfObstacles;
    validity.out === 1;
    
    log(validity.out);
    validity.out ==> out;
    out === 1;
}



component main = BFS();
