include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

// searches whether a grid can be traversed from point A to point B
// applications: prove that a player has traversed from point 1 to point b without revealing location
// TODO: Copy code from main.circom to here
// TODO: Figure out better compilation workflow

template BFS() {
    signal input map[4][4]; // 4 by 4 grid. 1 denotes obstacle, 0 denotes traversable path
    signal private input numberOfObstacles;

    signal output out;

    signal sumS;

    var obstacles = 0;

    component is_obstacle[4][4];
    
    for(var i=0; i<4; i++){
      for(var j=0; j<4; j++){
        is_obstacle[i][j] = IsEqual();
        is_obstacle[i][j].in[0] <== map[i][j];
        is_obstacle[i][j].in[1] <== 1;
        obstacles += is_obstacle[i][j].out;
      }
    }

    sumS <== obstacles;

    component validity = IsEqual();
    validity.in[0] <== sumS;
    validity.in[1] <== numberOfObstacles;
    validity.out === 1;
    
    out <-- validity.out;
    out === 1;
}



component main = BFS();
