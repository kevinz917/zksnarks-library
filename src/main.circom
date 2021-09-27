include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

// searches whether a grid can be traversed from point A to point B
// applications: prove that a player has traversed from point 1 to point b without revealing location
// TODO: Copy code from main.circom to here
// TODO: Figure out better compilation workflow

include "../node_modules/circomlib/circuits/gates.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template BFS() {
   signal private input cards[5]; // Each 2..14
   signal output out; // 1 or 0

   // Count pairs
   var numPairs = 0;
   for (var i=0; i<4; i++) {
    for (var j=i+1; j<5; j++) {
      if (cards[i] == cards[j]) {
        numPairs++;
        //break; // 3-or-4-of-a-kind counts as 1 pair
        // break doesn't work. Just force j and i to exit
        j = 5;
        i = 5;
      }
    }
   }

   log(numPairs);

   // Constraint: numPairs must be > 0 if isBid = 1
   var hasPairs = (numPairs > 0);

   component not3 = NOT(); // Use this bullshit to represent the opposite notation? wtf
   not3.in <-- 1;

   component or2 = OR();
   or2.a <-- 1;
   or2.b <-- not3.out; // 1
   or2.out === 1;

   out <-- or2.out;
   out === 1;
}

component main = BFS();